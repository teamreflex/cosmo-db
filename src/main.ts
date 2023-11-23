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
      collectionBatch.set(collection.collectionId, collection);

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

async function handleCollection(
  ctx: DataHandlerContext<Store>,
  metadata: ObjektMetadata,
  buffer: Map<string, Collection>,
  transfer: Transfer
) {
  // fetch from db
  let collection = await ctx.store.get(Collection, {
    where: {
      collectionId: metadata.objekt.collectionId,
    },
  });

  // fetch out of buffer
  if (!collection) {
    collection = buffer.get(metadata.objekt.collectionId);
  }

  // create
  if (!collection) {
    collection = new Collection({
      id: v4(),
      contract: addr(metadata.objekt.tokenAddress),
      createdAt: new Date(transfer.timestamp),
      collectionId: metadata.objekt.collectionId,
      season: metadata.objekt.season,
      member: metadata.objekt.member,
      artist: metadata.objekt.artists[0],
      collectionNo: metadata.objekt.collectionNo,
      class: metadata.objekt.class,
      frontImage: metadata.objekt.frontImage,
      backImage: metadata.objekt.backImage,
      backgroundColor: metadata.objekt.backgroundColor,
      textColor: metadata.objekt.textColor,
      comoAmount: metadata.objekt.comoAmount,
      onOffline: metadata.objekt.collectionNo.includes("Z")
        ? "online"
        : "offline",
    });
  }

  return collection;
}

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
    });
  }

  return objekt;
}
