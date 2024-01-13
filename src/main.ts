import "@total-typescript/ts-reset/filter-boolean";
import { processor } from "./processor";
import { Store, db } from "./db";
import { PARALLEL_COUNT } from "./constants";
import { TransferabilityUpdate, parseBlocks } from "./parser";
import { ObjektMetadata, fetchMetadataFromCosmo } from "./objekt";
import { Collection, Objekt, Transfer } from "./model";
import { addr } from "./util";
import { v4 } from "uuid";
import { DataHandlerContext } from "@subsquid/evm-processor";

processor.run(db, async (ctx) => {
  const { transferBuffer, transferabilityBuffer } = parseBlocks(ctx.blocks);

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

    // upsert collections
    if (collectionBatch.size > 0) {
      await ctx.store.upsert(Array.from(collectionBatch.values()));
    }

    // update objekt transferability
    ctx.log.info(
      `Handling ${transferabilityBuffer.length} transferability updates`
    );
    for (const update of transferabilityBuffer) {
      const objekt = await handleTransferability(ctx, objektBatch, update);
      if (objekt) {
        objektBatch.set(objekt.id, objekt);
      }
    }

    // upsert objekts
    if (objektBatch.size > 0) {
      await ctx.store.upsert(Array.from(objektBatch.values()));
    }
  }

  // upsert transfers
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
  // fetch out of buffer
  let objekt = buffer.get(transfer.tokenId);

  // fetch from db
  if (!objekt) {
    objekt = await ctx.store.get(Objekt, transfer.tokenId);
  }

  // if not new, update fields. skip transferable & usedForGrid
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
      transferable: metadata.objekt.transferable,
      // an objekt cannot be created as already usedForGrid
      usedForGrid: false,
    });
  }

  return objekt;
}

/**
 * Update an objekt's transferable status.
 */
async function handleTransferability(
  ctx: DataHandlerContext<Store>,
  buffer: Map<string, Objekt>,
  update: TransferabilityUpdate
) {
  // fetch out of buffer
  let objekt = buffer.get(update.tokenId);

  // fetch from db
  if (!objekt) {
    objekt = await ctx.store.get(Objekt, {
      relations: { collection: true },
      where: {
        id: update.tokenId,
      },
    });
  }

  // shouldn't happen but oh well?
  if (!objekt) return undefined;

  objekt.transferable = update.transferable;
  // naive assumption but should be okay
  objekt.usedForGrid =
    objekt.collection.class === "First" && update.transferable === false;
  return objekt;
}
