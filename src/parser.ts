import { Transfer } from "./model";
import { Fields, Log, Transaction } from "./processor";
import { addr } from "./util";
import { BlockData } from "@subsquid/evm-processor";
import * as objektAbi from "./abi/objekt";
import * as comoAbi from "./abi/como";
import * as governorAbi from "./abi/governor";
import { CONTRACTS } from "./constants";
import { randomUUID } from "crypto";

const transferability = objektAbi.functions.batchUpdateObjektTransferrability;
const reveal = governorAbi.functions.reveal;

/**
 * Parse incoming blocks.
 */
export function parseBlocks(blocks: BlockData<Fields>[]) {
  const logs = blocks.flatMap((block) => block.logs);
  const transactions = blocks.flatMap((block) => block.transactions);

  return {
    // objekt transfers
    transfers: logs
      .map(parseTransferEvent)
      .filter((e) => e !== undefined)
      .map(
        (event) =>
          new Transfer({
            id: randomUUID(),
            from: event.from,
            to: event.to,
            timestamp: new Date(event.timestamp),
            tokenId: event.tokenId,
            hash: event.hash,
          })
      ),

    // objekt transferability updates
    transferability: transactions
      .filter(
        (tx) =>
          !!tx.to &&
          CONTRACTS.Objekt.includes(addr(tx.to)) &&
          tx.sighash === transferability.sighash
      )
      .flatMap(parseTransferabilityUpdate)
      .filter((e) => e !== undefined),

    // como balance updates
    comoBalanceUpdates: logs
      .filter((log) => CONTRACTS.Como.includes(addr(log.address)))
      .map(parseComoBalanceEvent)
      .filter((e) => e !== undefined),

    // vote creations
    votes: logs
      .filter((log) => CONTRACTS.Governor.includes(addr(log.address)))
      .map(parseVote)
      .filter((e) => e !== undefined),

    // vote reveals
    voteReveals: transactions
      .filter((tx) => !!tx.to && CONTRACTS.Governor.includes(addr(tx.to)))
      .flatMap(parseVoteReveal),
  };
}

export type TransferEvent = {
  hash: string;
  contract: string;
  from: string;
  to: string;
  tokenId: string;
  timestamp: number;
};

/**
 * Parse a log into a Transfer.
 */
export function parseTransferEvent(log: Log): TransferEvent | undefined {
  try {
    if (log.topics[0] === objektAbi.events.Transfer.topic) {
      const event = objektAbi.events.Transfer.decode(log);
      return {
        hash: log.transactionHash,
        from: addr(event.from),
        to: addr(event.to),
        contract: addr(log.address),
        tokenId: event.tokenId.toString(),
        timestamp: log.block.timestamp,
      };
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
}

export type TransferabilityUpdate = {
  tokenId: string;
  transferable: boolean;
};

/**
 * Parse an event into an objekt update.
 */
export function parseTransferabilityUpdate(
  tx: Transaction
): TransferabilityUpdate[] {
  try {
    const { tokenIds, transferrable } = transferability.decode(tx.input);

    return tokenIds.map((tokenId) => ({
      tokenId: tokenId.toString(),
      transferable: transferrable,
    }));
  } catch (err) {
    return [];
  }
}

export type ComoBalanceEvent = {
  hash: string;
  contract: string;
  from: string;
  to: string;
  value: bigint;
  timestamp: number;
};

/**
 * Parse a log into a ComoBalance.
 */
export function parseComoBalanceEvent(log: Log): ComoBalanceEvent | undefined {
  try {
    if (log.topics[0] === comoAbi.events.Transfer.topic) {
      const event = comoAbi.events.Transfer.decode(log);

      return {
        hash: log.transactionHash,
        from: addr(event.from),
        to: addr(event.to),
        contract: addr(log.address),
        value: event.value,
        timestamp: log.block.timestamp,
      };
    }

    return undefined;
  } catch (err) {
    return undefined;
  }
}

export type VoteEvent = {
  id: string;
  from: string;
  timestamp: number;
  contract: string;
  pollId: number;
  index: number;
  amount: bigint;
};

/**
 * Parse a log into a vote.
 */
export function parseVote(log: Log): VoteEvent | undefined {
  try {
    const event = governorAbi.events.Voted.decode(log);

    return {
      id: log.id,
      from: addr(event.voter),
      timestamp: log.block.timestamp,
      contract: addr(log.address),
      pollId: Number(event.pollId),
      index: Number(event.voteIndex),
      amount: event.comoAmount,
    };
  } catch (err) {
    return undefined;
  }
}

export type VoteReveal = {
  contract: string;
  pollId: number;
  candidateId: number;
  index: number;
};

/**
 * Parse an transaction into vote reveals.
 */
export function parseVoteReveal(tx: Transaction): VoteReveal[] {
  if (!tx.to) return [];

  try {
    const { pollId, offset, data } = reveal.decode(tx.input);

    return data.map((entry, i) => ({
      contract: addr(tx.to!),
      pollId: Number(pollId),
      candidateId: Number(entry.votedCandidateId),
      index: i + Number(offset),
    }));
  } catch (err) {
    return [];
  }
}
