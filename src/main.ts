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

    // iterate over each item in the batch
    for (
      let metadataIndex = 0;
      metadataIndex < metadata.length;
      metadataIndex++
    ) {
      const result = metadata[metadataIndex];
      const event = current[metadataIndex];

      if (result.status === "fulfilled" && result.value.objekt !== undefined) {
        // handle objekt
        const newObjekt = await handleCollection(objekts, ctx, result.value);
        if (newObjekt) {
          newObjekt.timestamp = BigInt(event.timestamp);
          objekts.push(newObjekt);
        }

        // handle como transfer
        if (result.value.objekt.class === "Special") {
          const newCalendars = await handleComo(
            ctx,
            calendars,
            event,
            result.value
          );
          if (newCalendars.length > 0) {
            calendars.push(...newCalendars);
          }
        }
      } else {
        ctx.log.error(`Unable to fetch metadata for token ${event.tokenId}`);
      }
    }

    // save entities
    if (objekts.length > 0) {
      await ctx.store.upsert(objekts);
    }
    if (calendars.length > 0) {
      await ctx.store.upsert(calendars);
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
 * Update the como calendars for the event.
 */
async function handleComo(
  ctx: DataHandlerContext<Store>,
  buffer: ComoCalendar[],
  event: TransferEvent,
  metadata: ObjektMetadata
) {
  const day = new Date(event.timestamp).getDate();
  const isMint = matches(event.from, MINT_ADDRESS);
  const isBurn = matches(event.to, MINT_ADDRESS);

  // transfer is a new mint, only update the recipient calendar
  if (isMint && !isBurn) {
    const calendar = await getCalendar(
      buffer,
      ctx,
      day,
      addr(event.to),
      addr(metadata.objekt.tokenAddress)
    );
    calendar.amount += metadata.objekt.comoAmount;
    return [calendar];
  }

  // transfer is a burn, do nothing
  if (!isMint && isBurn) {
    return [];
  }

  // transfer is a valid send, update both calendars
  if (!isMint && !isBurn) {
    const sender = await getCalendar(
      buffer,
      ctx,
      day,
      addr(event.from),
      addr(metadata.objekt.tokenAddress)
    );
    sender.amount -= metadata.objekt.comoAmount;

    const recipient = await getCalendar(
      buffer,
      ctx,
      day,
      addr(event.to),
      addr(metadata.objekt.tokenAddress)
    );
    recipient.amount += metadata.objekt.comoAmount;

    return [sender, recipient];
  }

  // can't be a mint and burn at the same time, i think
  return [];
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
async function getCalendar(
  buffer: ComoCalendar[],
  ctx: DataHandlerContext<Store>,
  day: number,
  address: string,
  contract: string
) {
  // check the buffer
  let calendar = buffer.find(
    (c) =>
      matches(c.address, address) &&
      c.day === day &&
      matches(c.contract, contract)
  );

  // check the database
  if (!calendar) {
    calendar = await ctx.store.findOneBy(ComoCalendar, {
      address: addr(address),
      day,
      contract: addr(contract),
    });
  }

  // create if necessary
  if (!calendar) {
    calendar = new ComoCalendar({
      address: addr(address),
      amount: 0,
      contract: addr(contract),
      day,
    });
  }

  return calendar;
}
