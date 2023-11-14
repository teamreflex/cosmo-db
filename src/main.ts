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

function calendarKey(contract: string, address: string, day: number) {
  return `${addr(contract)}:${addr(address)}:${day}`;
}

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
    const objekts = new Map<string, Objekt>();
    const calendars = new Map<string, ComoCalendar>();

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
        const objekt = await getExistingObjekt(objekts, ctx, result.value);
        if (objekt === undefined) {
          ctx.log.info(
            `Inserting new objekt ${result.value.objekt.collectionId}`
          );
          const newObjekt = await buildObjektEntity(result.value);
          if (newObjekt) {
            newObjekt.timestamp = BigInt(event.timestamp);
            objekts.set(newObjekt.collectionId, newObjekt);
          }
        }

        // handle como transfer
        if (result.value.objekt.class === "Special") {
          const newCalendars = await handleComo(
            ctx,
            calendars,
            event,
            result.value
          );
          for (let calendar of newCalendars) {
            if (matches(calendar.address, MINT_ADDRESS)) continue;
            calendars.set(
              calendarKey(calendar.contract, calendar.address, calendar.day),
              calendar
            );
          }
        }
      } else {
        ctx.log.error(`Unable to fetch metadata for token ${event.tokenId}`);
      }
    }

    // save entities
    if (objekts.size > 0) {
      await ctx.store.upsert(Array.from(objekts.values()));
    }
    if (calendars.size > 0) {
      await ctx.store.upsert(Array.from(calendars.values()));
    }
  }
});

/**
 * Update the como calendars for the event.
 */
async function handleComo(
  ctx: DataHandlerContext<Store>,
  buffer: Map<string, ComoCalendar>,
  event: TransferEvent,
  metadata: ObjektMetadata
) {
  const day = new Date(event.timestamp).getDate();

  const sender = await getCalendar(
    buffer,
    ctx,
    day,
    event.from,
    addr(metadata.objekt.tokenAddress)
  );
  sender.amount -= metadata.objekt.comoAmount;

  const recipient = await getCalendar(
    buffer,
    ctx,
    day,
    event.to,
    addr(metadata.objekt.tokenAddress)
  );
  recipient.amount += metadata.objekt.comoAmount;

  return [sender, recipient];
}

/**
 * Pull existing objekt from buffer or db.
 */
async function getExistingObjekt(
  buffer: Map<string, Objekt>,
  ctx: DataHandlerContext<Store>,
  metadata: ObjektMetadata
) {
  let existing = buffer.get(metadata.objekt.collectionId);
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
  buffer: Map<string, ComoCalendar>,
  ctx: DataHandlerContext<Store>,
  day: number,
  address: string,
  contract: string
) {
  // check the buffer
  let calendar = buffer.get(calendarKey(contract, address, day));
  if (calendar) return calendar;

  // check the database
  calendar = await ctx.store.findOneBy(ComoCalendar, {
    address,
    day,
    contract: addr(contract),
  });
  if (calendar) return calendar;

  // create if necessary
  return new ComoCalendar({
    address,
    amount: 0,
    contract: addr(contract),
    day,
  });
}
