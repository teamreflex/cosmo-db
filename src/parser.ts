import { Transfer } from "./model";
import { Fields, Log, Transaction } from "./processor";
import { addr } from "./util";
import { BlockData } from "@subsquid/evm-processor";
import * as ABI_OBJEKT from "./abi/objekt";
import { CONTRACTS } from "./constants";
import { randomUUID } from "crypto";

const transferability = ABI_OBJEKT.functions.batchUpdateObjektTransferability;

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
      .map((event) => {
        return new Transfer({
          id: randomUUID(),
          from: event.from,
          to: event.to,
          timestamp: new Date(event.timestamp),
          tokenId: event.tokenId,
          hash: event.hash,
        });
      }),

    // objekt transferability updates
    transferability: transactions
      .filter(
        (tx) =>
          !!tx.to &&
          CONTRACTS.OBJEKT === addr(tx.to) &&
          tx.sighash === transferability.sighash
      )
      .flatMap(parseTransferabilityUpdate)
      .filter((e) => e !== undefined),
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
    if (log.topics[0] === ABI_OBJEKT.events.Transfer.topic) {
      const event = ABI_OBJEKT.events.Transfer.decode(log);
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
    const { tokenIds, transferable } = transferability.decode(tx.input);

    return tokenIds.map((tokenId) => ({
      tokenId: tokenId.toString(),
      transferable: transferable,
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
