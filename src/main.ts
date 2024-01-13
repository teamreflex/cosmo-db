import "@total-typescript/ts-reset/filter-boolean";
import { processor } from "./processor";
import { Store, db } from "./db";
import { CONTRACTS, PARALLEL_COUNT } from "./constants";
import { parseEvent } from "./parser";
import { ObjektMetadata, fetchMetadataFromCosmo } from "./objekt";
import { Collection, Objekt, Transfer } from "./model";
import { addr } from "./util";
import { v4 } from "uuid";
import { DataHandlerContext } from "@subsquid/evm-processor";

processor.run(db, async (ctx) => {
  const transferBuffer = ctx.blocks
    .flatMap((block) => block.logs)
    .filter((log) => CONTRACTS.includes(addr(log.address)))
    .map(parseEvent)
    .filter(Boolean)
    .map(
      (event) =>
        new Transfer({
          id: v4(),
          from: event.from,
          to: event.to,
          timestamp: new Date(event.timestamp),
          tokenId: event.tokenId,
          hash: event.hash,
        })
    );

  // chunk everything into batches
  for (let i = 0; i < transferBuffer.length; i += PARALLEL_COUNT) {
    const current = transferBuffer.slice(i, i + PARALLEL_COUNT);
    const transferBatch: Transfer[] = [];
    const collectionBatch = new Map<string, Collection>();
    const objektBatch = new Map<string, Objekt>();

    ctx.log.info(`Fetching metadata for ${current.length} tokens`);
    const metadataBatch = await Promise.allSettled(
      current.map((e) => fetchMetadataFromCosmo(e.tokenId))
    );

    // iterate over each objekt
    for (let j = 0; j < metadataBatch.length; j++) {
      const request = metadataBatch[j];
      const currentTransfer = current[j];
      if (
        request.status === "rejected" ||
        !request.value ||
        !request.value.objekt
      ) {
        ctx.log.error(
          `Unable to fetch metadata for token ${currentTransfer.tokenId}`
        );
        continue;
      }

      // handle collection
      const collection = await handleCollection(
        ctx,
        request.value,
        collectionBatch,
        currentTransfer
      );
      collectionBatch.set(collection.slug, collection);

      // handle objekt
      const objekt = await handleObjekt(
        ctx,
        request.value,
        objektBatch,
        currentTransfer
      );
      objekt.collection = collection;
      objektBatch.set(objekt.id, objekt);

      // handle transfer
      currentTransfer.objekt = objekt;
      currentTransfer.collection = collection;
      transferBatch.push(currentTransfer);
    }

    if (collectionBatch.size > 0) {
      await ctx.store.upsert(Array.from(collectionBatch.values()));
    }

    if (objektBatch.size > 0) {
      await ctx.store.upsert(Array.from(objektBatch.values()));
    }
  }

  if (transferBuffer.length > 0) {
    await ctx.store.upsert(transferBuffer);
  }
});

/**
 * Create or update the collection row.
 */
async function handleCollection(
  ctx: DataHandlerContext<Store>,
  metadata: ObjektMetadata,
  buffer: Map<string, Collection>,
  transfer: Transfer
) {
  const slug = metadata.objekt.collectionId.replace(/ /g, "-").toLowerCase();

  // fetch from db
  let collection = await ctx.store.get(Collection, {
    where: {
      slug: slug,
    },
  });

  // fetch out of buffer
  if (!collection) {
    collection = buffer.get(slug);
  }

  // create
  if (!collection) {
    collection = new Collection({
      id: v4(),
      contract: addr(metadata.objekt.tokenAddress),
      createdAt: new Date(transfer.timestamp),
      collectionId: metadata.objekt.collectionId,
      slug: slug,
    });
  }

  // set and/or update metadata
  collection.season = metadata.objekt.season;
  collection.member = metadata.objekt.member;
  collection.artist = metadata.objekt.artists[0];
  collection.collectionNo = metadata.objekt.collectionNo;
  collection.class = metadata.objekt.class;
  collection.comoAmount = metadata.objekt.comoAmount;
  collection.onOffline = metadata.objekt.collectionNo.includes("Z")
    ? "online"
    : "offline";
  collection.thumbnailImage = metadata.objekt.thumbnailImage;
  collection.frontImage = metadata.objekt.frontImage;
  collection.backImage = metadata.objekt.backImage;
  collection.backgroundColor = metadata.objekt.backgroundColor;
  collection.textColor = metadata.objekt.textColor;
  collection.accentColor = metadata.objekt.accentColor;

  return collection;
}

/**
 * Create or update the objekt row.
 */
async function handleObjekt(
  ctx: DataHandlerContext<Store>,
  metadata: ObjektMetadata,
  buffer: Map<string, Objekt>,
  transfer: Transfer
) {
  // fetch from db
  let objekt = await ctx.store.get(Objekt, transfer.tokenId);

  // fetch out of buffer
  if (!objekt) {
    objekt = buffer.get(transfer.tokenId);
  }

  // if not new, update fields
  if (objekt) {
    objekt.receivedAt = new Date(transfer.timestamp);
    objekt.owner = addr(transfer.to);
    objekt.transferable = metadata.objekt.transferable;
    objekt.usedForGrid = objekt.transferable && !metadata.objekt.transferable;
    return objekt;
  }

  // otherwise create it
  if (!objekt) {
    objekt = new Objekt({
      id: transfer.tokenId,
      mintedAt: new Date(transfer.timestamp),
      receivedAt: new Date(transfer.timestamp),
      owner: addr(transfer.to),
      serial: metadata.objekt.objektNo,
      transferable: metadata.objekt.transferable,
      // an objekt cannot be created as already usedForGrid
      usedForGrid: false,
    });
  }

  return objekt;
}
