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

processor.run(db, async (ctx) => {
  const events: TransferEvent[] = [];

  // parse token ids from blocks
  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      if (!CONTRACTS.includes(log.address.toLowerCase())) continue;

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
      events.map((e) => fetchMetadataFromCosmo(e.tokenId))
    );

    // act upon each objekt
    for (let result of metadata) {
      if (result.status === "fulfilled" && result.value.objekt !== undefined) {
        // handle objekt
        const currentObjekt = await handleCollection(
          objekts,
          ctx,
          result.value
        );
        if (currentObjekt) {
          currentObjekt.timestamp = BigInt(events[i].timestamp);
          objekts.push(currentObjekt);
        }

        // handle como transfer
        if (result.value.objekt.class === "Special") {
          const currentCalendars = await handleComo(
            calendars,
            ctx,
            events[i],
            result.value.objekt.comoAmount
          );
          calendars.push(...currentCalendars);
        }
      } else {
        ctx.log.error(
          `Unable to fetch metadata for token ${events[i].tokenId}`
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
  comoAmount: number
) {
  const entities: ComoCalendar[] = [];
  const senderIsMint = event.from === MINT_ADDRESS;
  const recipientIsBurn = event.to === MINT_ADDRESS; // should never happen?
  const day = new Date(event.timestamp).getDate();

  let { sender, recipient } = await getExistingCalendars(buffer, ctx, event);

  // skip updating the sender calendar upon a new mint
  if (senderIsMint === false) {
    if (sender) {
      sender.amount -= comoAmount;
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

  // skip updating the recipient calendar upon a burn
  if (recipientIsBurn === false) {
    if (recipient) {
      recipient.amount += comoAmount;
    } else {
      recipient = new ComoCalendar({
        address: event.to,
        amount: comoAmount,
        contract: event.contract,
        day,
      });
    }
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
 * Pull existing calendar from buffer or db.
 */
async function getExistingCalendars(
  buffer: ComoCalendar[],
  ctx: DataHandlerContext<Store>,
  event: TransferEvent
) {
  const day = new Date(event.timestamp).getDate();

  let sender = buffer.find(
    (c) =>
      c.address === event.from && c.day === day && c.contract === event.contract
  );
  if (!sender) {
    sender = await ctx.store.findOneBy(ComoCalendar, {
      address: event.from,
      day,
      contract: event.contract,
    });
  }

  let recipient = buffer.find(
    (c) =>
      c.address === event.to && c.day === day && c.contract === event.contract
  );
  if (!recipient) {
    recipient = await ctx.store.findOneBy(ComoCalendar, {
      address: event.to,
      day,
      contract: event.contract,
    });
  }

  return { sender, recipient };
}
