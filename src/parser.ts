import * as spec from "./abi/objekt";
import { CONTRACTS } from "./constants";
import { Transfer } from "./model";
import { Log, Transaction } from "./processor";
import { addr } from "./util";
import * as contractAbi from "./abi/objekt";
import { BlockData } from "@subsquid/evm-processor";
import { v4 } from "uuid";

const transferability = contractAbi.functions.batchUpdateObjektTransferrability;

type ConfiguredBlock = BlockData<{
  log: {
    topics: true;
    data: true;
    transactionHash: true;
  };
  transaction: {
    hash: true;
    input: true;
    from: true;
    value: true;
    status: true;
    sighash: true;
  };
}>;

/**
 * Parse incoming blocks into transfers and objekt updates.
 */
export function parseBlocks(blocks: ConfiguredBlock[]) {
  const transfers = blocks
    .flatMap((block) => block.logs)
    .filter((log) => CONTRACTS.includes(addr(log.address)))
    .map(parseTransferEvent)
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

  const objektUpdates = blocks
    .flatMap((block) => block.transactions)
    .filter(
      (tx) =>
        tx.to !== undefined &&
        CONTRACTS.includes(addr(tx.to)) &&
        tx.sighash === transferability.sighash
    )
    .flatMap(parseTransferabilityUpdate);

  return {
    transferBuffer: transfers,
    transferabilityBuffer: objektUpdates,
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
    if (log.topics[0] === spec.events["Transfer"].topic) {
      const event = spec.events["Transfer"].decode(log);
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
 * Parse a transaction into an objekt update.
 */
export function parseTransferabilityUpdate(
  tx: Transaction
): TransferabilityUpdate[] {
  try {
    const calldata = transferability.decode(tx.input);

    return calldata.tokenIds.map((tokenId) => ({
      tokenId: tokenId.toString(),
      transferable: calldata.transferrable,
    }));
  } catch (err) {
    return [];
  }
}
