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
      const event = current[metadataIndex];

      if (result.status === "fulfilled" && result.value.objekt !== undefined) {
        // handle objekt
        const newObjekt = await handleCollection(objekts, ctx, result.value);
        if (newObjekt) {
          newObjekt.timestamp = BigInt(event.timestamp);
          objekts.push(newObjekt);
        }

        // handle como transfer
        if (result.value.objekt.class !== "Special") continue;
        const { sender, recipient } = await getCalendars(
          calendars,
          ctx,
          event,
          result.value
        );
        const newCalendars = await handleComo(
          sender,
          recipient,
          event,
          result.value
        );
        if (newCalendars.length > 0) {
          calendars.push(...newCalendars);
        }
      } else {
        ctx.log.error(`Unable to fetch metadata for token ${event.tokenId}`);
        continue;
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
 * Upsert the como calendar record for the sender and recipient.
 */
async function handleComo(
  sender: ComoCalendar,
  recipient: ComoCalendar,
  event: TransferEvent,
  metadata: ObjektMetadata
) {
  const entities: ComoCalendar[] = [];
  const senderIsMint = matches(event.from, MINT_ADDRESS);
  const recipientIsBurn = matches(event.to, MINT_ADDRESS); // should never happen?

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
