import "@total-typescript/ts-reset/filter-boolean";
import { processor } from "./processor";
import { db } from "./db";
import { CONTRACTS, PARALLEL_COUNT } from "./constants";
import { parseEvent } from "./parser";
import { fetchMetadataFromCosmo } from "./objekt";
import { Objekt, Transfer } from "./model";
import { addr } from "./util";
import { v4 } from "uuid";

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
    const objektBatch = new Map<string, Objekt>();

    ctx.log.info(`Fetching metadata for ${current.length} tokens`);
    const metadataBatch = await Promise.allSettled(
      current.map((e) => fetchMetadataFromCosmo(e.tokenId))
    );

    // iterate over each objekt
    for (let j = 0; j < metadataBatch.length; j++) {
      const request = metadataBatch[j];
      const currentTransfer = current[j];
      if (request.status === "rejected") {
        ctx.log.error(
          `Unable to fetch metadata for token ${currentTransfer.tokenId}`
        );
        continue;
      }
      const objektMetadata = request.value.objekt;

      // pull existing objekt out from db
      let objekt = await ctx.store.get(Objekt, {
        where: {
          collectionId: objektMetadata.collectionId,
        },
      });
      // fetch out of buffer
      if (!objekt) {
        objekt = objektBatch.get(objektMetadata.collectionId);
      }
      // create
      if (!objekt) {
        objekt = new Objekt({
          id: objektMetadata.tokenId,
          contract: addr(objektMetadata.tokenAddress),
          timestamp: new Date(currentTransfer.timestamp),
          collectionId: objektMetadata.collectionId,
          season: objektMetadata.season,
          member: objektMetadata.member,
          artist: objektMetadata.artists[0],
          collectionNo: objektMetadata.collectionNo,
          class: objektMetadata.class,
          frontImage: objektMetadata.frontImage,
          backImage: objektMetadata.backImage,
          backgroundColor: objektMetadata.backgroundColor,
          textColor: objektMetadata.textColor,
          comoAmount: objektMetadata.comoAmount,
          onOffline: objektMetadata.collectionNo.includes("Z")
            ? "online"
            : "offline",
        });
      }

      currentTransfer.objekt = objekt;
      transferBatch.push(currentTransfer);
      objektBatch.set(objekt.collectionId, objekt);
    }

    if (objektBatch.size > 0) {
      await ctx.store.upsert(Array.from(objektBatch.values()));
    }
  }

  if (transferBuffer.length > 0) {
    await ctx.store.upsert(transferBuffer);
  }
});
