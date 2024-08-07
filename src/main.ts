import { processor, ProcessorContext } from "./processor";
import { BURN_ADDRESS, CONTRACTS, PARALLEL_COUNT } from "./constants";
import {
  ComoBalanceEvent,
  TransferabilityUpdate,
  VoteEvent,
  VoteReveal,
  parseBlocks,
} from "./parser";
import { ObjektMetadata, fetchMetadataFromCosmo } from "./objekt";
import { Collection, ComoBalance, Objekt, Transfer, Vote } from "./model";
import { addr, chunk } from "./util";
import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { randomUUID } from "crypto";
import { env } from "./env/processor";

const db = new TypeormDatabase({ supportHotBlocks: true });

processor.run(db, async (ctx) => {
  const { transfers, transferability, comoBalanceUpdates, votes, voteReveals } =
    parseBlocks(ctx.blocks);

  if (env.ENABLE_OBJEKTS) {
    if (transfers.length > 0) {
      ctx.log.info(`Processing ${transfers.length} objekt transfers`);
    }

    // chunk everything into batches
    await chunk(transfers, PARALLEL_COUNT, async (chunk) => {
      const transferBatch: Transfer[] = [];
      const collectionBatch = new Map<string, Collection>();
      const objektBatch = new Map<string, Objekt>();

      const metadataBatch = await Promise.allSettled(
        chunk.map((e) => fetchMetadataFromCosmo(e.tokenId))
      );

      // iterate over each objekt
      for (let j = 0; j < metadataBatch.length; j++) {
        const request = metadataBatch[j];
        const currentTransfer = chunk[j];
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

      if (transferability.length > 0) {
        ctx.log.info(
          `Handling ${transferability.length} transferability updates`
        );
      }
      // update objekt transferability
      for (const update of transferability) {
        const objekt = await handleTransferability(ctx, objektBatch, update);
        if (objekt) {
          objektBatch.set(objekt.id, objekt);
        }
      }

      // upsert objekts
      if (objektBatch.size > 0) {
        await ctx.store.upsert(Array.from(objektBatch.values()));
      }
    });

    // upsert transfers
    if (transfers.length > 0) {
      await ctx.store.upsert(transfers);
    }
  }

  if (env.ENABLE_GRAVITY) {
    const voteBatch: Vote[] = [];

    if (votes.length > 0) {
      ctx.log.info(`Processing ${votes.length} gravity votes`);
    }

    // handle vote creation
    for (let i = 0; i < votes.length; i++) {
      const vote = await handleVoteCreation(votes[i]);
      voteBatch.push(vote);
    }

    if (voteReveals.length > 0) {
      ctx.log.info(`Processing ${voteReveals.length} gravity vote reveals`);
    }

    // handle vote reveals
    for (let i = 0; i < voteReveals.length; i++) {
      try {
        const vote = await handleVoteReveal(ctx, voteBatch, voteReveals[i]);
        const batchIndex = voteBatch.findIndex((v) => v.id === vote.id);
        if (batchIndex > -1) {
          voteBatch[batchIndex] = vote;
        } else {
          voteBatch.push(vote);
        }
      } catch (err) {
        ctx.log.error(`Unable to handle vote reveal: ${err}`);
      }
    }

    if (voteBatch.length > 0) {
      await ctx.store.upsert(voteBatch);
    }

    if (comoBalanceUpdates.length > 0) {
      ctx.log.info(
        `Processing ${comoBalanceUpdates.length} COMO balance updates`
      );
    }

    // handle como balance updates
    await chunk(comoBalanceUpdates, 2000, async (chunk) => {
      const comoBalanceBatch = new Map<string, ComoBalance>();
      for (let i = 0; i < chunk.length; i++) {
        const balances = await handleComoBalanceUpdate(
          ctx,
          comoBalanceBatch,
          chunk[i]
        );

        balances.forEach((balance) => {
          comoBalanceBatch.set(
            balanceKey({ owner: balance.owner, contract: balance.contract }),
            balance
          );
        });
      }

      if (comoBalanceBatch.size > 0) {
        await ctx.store.upsert(Array.from(comoBalanceBatch.values()));
      }
    });
  }
});

/**
 * Create or update the collection row.
 */
async function handleCollection(
  ctx: ProcessorContext<Store>,
  metadata: ObjektMetadata,
  buffer: Map<string, Collection>,
  transfer: Transfer
) {
  const slug = metadata.objekt.collectionId
    .replace(/[+()]/g, "") // remove special symbols
    .replace(/ /g, "-") // replace spaces with hyphens
    .toLowerCase(); // normalize to lowercase

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
      id: randomUUID(),
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
  ctx: ProcessorContext<Store>,
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

  // if not new, update fields. skip transferable
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
    });
  }

  return objekt;
}

/**
 * Update an objekt's transferable status.
 */
async function handleTransferability(
  ctx: ProcessorContext<Store>,
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
  return objekt;
}

/**
 * Create a new vote row.
 */
async function handleVoteCreation(event: VoteEvent) {
  return new Vote({
    id: randomUUID(),
    from: event.from,
    createdAt: new Date(event.timestamp),
    contract: event.contract,
    pollId: event.pollId,
    candidateId: undefined,
    index: event.index,
    amount: event.amount,
  });
}

/**
 * Update vote with reveal.
 */
async function handleVoteReveal(
  ctx: ProcessorContext<Store>,
  buffer: Vote[],
  event: VoteReveal
) {
  let vote = buffer.find((v) => {
    return (
      v.contract === event.contract &&
      v.pollId === event.pollId &&
      v.index === event.index
    );
  });

  // fetch from db
  if (!vote) {
    vote = await ctx.store.get(Vote, {
      where: {
        contract: event.contract,
        pollId: event.pollId,
        index: event.index,
      },
    });
  }

  if (!vote) {
    throw new Error(`Unable to find vote for reveal ${event.pollId}`);
  }

  // update vote
  vote.candidateId = event.candidateId;

  return vote;
}

const EXCLUDE = [...Object.values(CONTRACTS).flat(), BURN_ADDRESS];
/**
 * Update como balance.
 */
async function handleComoBalanceUpdate(
  ctx: ProcessorContext<Store>,
  buffer: Map<string, ComoBalance>,
  event: ComoBalanceEvent
) {
  const toUpdate: ComoBalance[] = [];

  if (EXCLUDE.includes(event.from) === false) {
    const from = await getBalance(ctx, buffer, event.from, event.contract);

    from.amount -= event.value;
    toUpdate.push(from);
  }

  if (EXCLUDE.includes(event.to) === false) {
    const to = await getBalance(ctx, buffer, event.to, event.contract);

    to.amount += event.value;
    toUpdate.push(to);
  }

  return toUpdate;
}

/**
 * For the sake of not being able to mess this up.
 */
function balanceKey({ owner, contract }: { owner: string; contract: string }) {
  return `${owner}-${contract}`;
}

/**
 * Fetch a como balance from the buffer, db or create a new one.
 */
async function getBalance(
  ctx: ProcessorContext<Store>,
  buffer: Map<string, ComoBalance>,
  owner: string,
  contract: string
) {
  let balance = buffer.get(balanceKey({ owner, contract }));

  // fetch from db
  if (!balance) {
    balance = await ctx.store.get(ComoBalance, {
      where: { owner, contract },
    });
  }

  // create
  if (!balance) {
    balance = new ComoBalance({
      id: randomUUID(),
      contract: contract,
      owner: owner,
      amount: BigInt(0),
    });
  }

  return balance;
}
