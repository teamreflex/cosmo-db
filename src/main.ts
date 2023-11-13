import { processor } from "./processor";
import { Store, db } from "./db";
import { CONTRACTS, MINT_ADDRESS, PARALLEL_COUNT } from "./constants";
import { TransferEvent, parseEvent } from "./parser";
import {
  ObjektMetadata,
  buildObjektEntity,
  fetchBatchMetadata,
} from "./objekt";
import { ComoCalendar, Objekt } from "./model";
import { DataHandlerContext } from "@subsquid/evm-processor";
import { NftTokenType } from "alchemy-sdk";

processor.run(db, async (ctx) => {
  const events: TransferEvent[] = [];

  // parse token ids from blocks
  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      if (!CONTRACTS.includes(log.address.toLowerCase())) continue;

      try {
        events.push(parseEvent(ctx, log));
      } catch (err) {
        // already logged at this point
        continue;
      }
    }
  }

  // fetch metadata for token ids
  for (let i = 0; i < events.length; i += PARALLEL_COUNT) {
    const objekts: Objekt[] = [];
    const calendars: ComoCalendar[] = [];

    const current = events.slice(i, i + PARALLEL_COUNT);

    ctx.log.info(`Fetching metadata for ${current.length} tokens`);

    const metadata = await fetchBatchMetadata(
      current.map((e) => ({
        tokenId: e.tokenId,
        contractAddress: e.contract,
        tokenType: NftTokenType.ERC721,
      }))
    );

    // act upon each objekt
    for (let result of metadata) {
      if (result.rawMetadata && result.rawMetadata.objekt) {
        const raw = result.rawMetadata as ObjektMetadata;
        // check the buffer/db if this objekt already exists
        let existingObjekt = objekts.find(
          (o) => o.collectionId === raw.objekt.collectionId
        );
        if (existingObjekt === undefined) {
          existingObjekt = await ctx.store.findOneBy(Objekt, {
            collectionId: raw.objekt.collectionId,
          });
        }

        const newObjekt = await handleCollection(ctx, existingObjekt, raw);
        if (newObjekt) {
          objekts.push(newObjekt);
        }

        if (raw.objekt.class === "Special") {
          const newCalendars = await handleComo(ctx, events[i], raw);
          if (newCalendars.length > 0) {
            calendars.push(...newCalendars);
          }
        }
      } else {
        ctx.log.error(
          `Unable to fetch metadata for token ${events[i].tokenId}`
        );
        continue;
      }
    }

    // const metadata = await Promise.allSettled(
    //   events.map((e) => fetchMetadata(e.tokenId))
    // );

    // // act upon each objekt
    // for (let result of metadata) {
    //   if (result.status === "fulfilled") {
    //     // check the db if this objekt already exists
    //     const existingObjekt = await ctx.store.findOneBy(Objekt, {
    //       collectionId: result.value.objekt.collectionId,
    //     });

    //     await handleCollection(ctx, existingObjekt, result.value);
    //     await handleComo(ctx, events[i], result.value);
    //   } else {
    //     ctx.log.error(
    //       result.reason,
    //       `Unable to fetch metadata for token ${events[i].tokenId}`
    //     );
    //     continue;
    //   }
    // }

    // save entities
    if (objekts.length) {
      await ctx.store.save(objekts);
    }
    if (calendars.length) {
      await ctx.store.save(calendars);
    }
  }
});

/**
 * Insert any new objekts into the database.
 */
async function handleCollection(
  ctx: DataHandlerContext<Store>,
  objekt: Objekt | undefined,
  metadata: ObjektMetadata
) {
  if (objekt !== undefined) return;

  ctx.log.info(`Inserting new objekt ${metadata.objekt.collectionId}`);
  return await buildObjektEntity(metadata);
}

/**
 * Upsert the como calendar record for the sender and recipient.
 */
async function handleComo(
  ctx: DataHandlerContext<Store>,
  event: TransferEvent,
  metadata: ObjektMetadata
) {
  const entities: ComoCalendar[] = [];
  const day = new Date(event.timestamp).getDate();

  let sender = await ctx.store.findOneBy(ComoCalendar, {
    address: event.from,
    day,
  });
  // update the sender
  if (event.from !== MINT_ADDRESS) {
    if (sender) {
      sender.amount -= metadata.objekt.comoAmount;
    } else {
      sender = new ComoCalendar({
        address: event.from,
        amount: 0,
        contract: event.contract,
        day,
      });
    }
    entities.push(sender);
  }

  let recipient = await ctx.store.findOneBy(ComoCalendar, {
    address: event.to,
    day,
  });

  // update the recipient
  if (event.to !== MINT_ADDRESS) {
    if (recipient) {
      recipient.amount += metadata.objekt.comoAmount;
    } else {
      recipient = new ComoCalendar({
        address: event.to,
        amount: metadata.objekt.comoAmount,
        contract: event.contract,
        day,
      });
    }
    entities.push(recipient);
  }

  return entities;
}
