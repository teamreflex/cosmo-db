import * as spec from "./abi/objekt";
import { CONTRACTS } from "./constants";
import { Transfer } from "./model";
import { Log, Transaction } from "./processor";
import { ConfiguredBlock, addr } from "./util";
import * as contractAbi from "./abi/objekt";

const transferability = contractAbi.functions.batchUpdateObjektTransferrability;

export function parseBlocks(blocks: ConfiguredBlock[]) {
  const transfers = blocks
    .flatMap((block) => block.logs)
    .filter((log) => CONTRACTS.includes(addr(log.address)))
    .map(parseTransferEvent)
    .filter(Boolean)
    .map(
      (event) =>
        new Transfer({
          id: event.hash,
          from: event.from,
          to: event.to,
          timestamp: new Date(event.timestamp),
          tokenId: event.tokenId,
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
