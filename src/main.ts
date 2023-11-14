import { processor } from "./processor";
import { Store, db } from "./db";
import { CONTRACTS, MINT_ADDRESS, PARALLEL_COUNT } from "./constants";
import { TransferEvent, parseEvent } from "./parser";
import {
  ObjektMetadata,
  buildObjektEntity,
  fetchMetadataFromCosmo,
} from "./objekt";
import { ComoCalendar, Objekt } from "./model";
import { DataHandlerContext } from "@subsquid/evm-processor";
import { addr, matches } from "./util";

processor.run(db, async (ctx) => {
  const events: TransferEvent[] = [];

  // parse token ids from blocks
  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      if (!CONTRACTS.includes(addr(log.address))) continue;

      try {
        events.push(parseEvent(ctx, log));
      } catch (err) {
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

    const metadata = await Promise.allSettled(
      current.map((e) => fetchMetadataFromCosmo(e.tokenId))
    );

    // act upon each objekt
    for (
      let metadataIndex = 0;
      metadataIndex < metadata.length;
      metadataIndex++
    ) {
      const result = metadata[metadataIndex];

      if (result.status === "fulfilled" && result.value.objekt !== undefined) {
        // handle objekt
        const currentObjekt = await handleCollection(
          objekts,
          ctx,
          result.value
        );
        if (currentObjekt) {
          currentObjekt.timestamp = BigInt(current[metadataIndex].timestamp);
          objekts.push(currentObjekt);
        }

        // handle como transfer
        if (result.value.objekt.class === "Special") {
          const currentCalendars = await handleComo(
            calendars,
            ctx,
            current[metadataIndex],
            result.value
          );
          calendars.push(...currentCalendars);
        }
      } else {
        ctx.log.error(
          `Unable to fetch metadata for token ${current[metadataIndex].tokenId}`
        );
        continue;
      }
    }

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
  buffer: Objekt[],
  ctx: DataHandlerContext<Store>,
  metadata: ObjektMetadata
) {
  const objekt = await getExistingObjekt(buffer, ctx, metadata);
  if (objekt !== undefined) return;

  ctx.log.info(`Inserting new objekt ${metadata.objekt.collectionId}`);
  return await buildObjektEntity(metadata);
}

/**
 * Upsert the como calendar record for the sender and recipient.
 */
async function handleComo(
  buffer: ComoCalendar[],
  ctx: DataHandlerContext<Store>,
  event: TransferEvent,
  metadata: ObjektMetadata
) {
  const entities: ComoCalendar[] = [];
  const senderIsMint = matches(event.from, MINT_ADDRESS);
  const recipientIsBurn = matches(event.to, MINT_ADDRESS); // should never happen?

  const { sender, recipient } = await getCalendars(
    buffer,
    ctx,
    event,
    metadata
  );

  // skip updating the sender calendar upon a new mint
  if (senderIsMint === false) {
    sender.amount -= metadata.objekt.comoAmount;
    entities.push(sender);
  }

  // skip updating the recipient calendar upon a burn
  if (recipientIsBurn === false) {
    recipient.amount += metadata.objekt.comoAmount;
    entities.push(recipient);
  }

  return entities;
}

/**
 * Pull existing objekt from buffer or db.
 */
async function getExistingObjekt(
  buffer: Objekt[],
  ctx: DataHandlerContext<Store>,
  metadata: ObjektMetadata
) {
  let existing = buffer.find(
    (o) => o.collectionId === metadata.objekt.collectionId
  );

  if (existing === undefined) {
    existing = await ctx.store.findOneBy(Objekt, {
      collectionId: metadata.objekt.collectionId,
    });
  }

  return existing;
}

/**
 * Pull existing calendar from buffer/db, or make the entity.
 */
async function getCalendars(
  buffer: ComoCalendar[],
  ctx: DataHandlerContext<Store>,
  event: TransferEvent,
  metadata: ObjektMetadata
) {
  const day = new Date(event.timestamp).getDate();

  // check the buffer
  let sender = buffer.find(
    (c) =>
      c.address === event.from &&
      c.day === day &&
      matches(c.contract, metadata.objekt.tokenAddress)
  );
  // check the database
  if (!sender) {
    sender = await ctx.store.findOneBy(ComoCalendar, {
      address: event.from,
      day,
      contract: addr(metadata.objekt.tokenAddress),
    });
  }
  // create if necessary
  if (!sender) {
    sender = new ComoCalendar({
      address: event.from,
      amount: 0,
      contract: addr(metadata.objekt.tokenAddress),
      day,
    });
  }

  // check the buffer
  let recipient = buffer.find(
    (c) =>
      c.address === event.to &&
      c.day === day &&
      matches(c.contract, metadata.objekt.tokenAddress)
  );
  // check the database
  if (!recipient) {
    recipient = await ctx.store.findOneBy(ComoCalendar, {
      address: event.to,
      day,
      contract: addr(metadata.objekt.tokenAddress),
    });
  }
  // create if necessary
  if (!recipient) {
    recipient = new ComoCalendar({
      address: event.to,
      amount: 0,
      contract: addr(metadata.objekt.tokenAddress),
      day,
    });
  }

  return { sender, recipient };
}
