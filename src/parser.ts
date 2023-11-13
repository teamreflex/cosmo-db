import { DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "./db";
import * as spec from "./abi/objekt";
import { Log } from "./processor";

export type TransferEvent = {
  contract: string;
  from: string;
  to: string;
  tokenId: string;
  timestamp: number;
};

export function parseEvent(
  ctx: DataHandlerContext<Store>,
  log: Log
): TransferEvent {
  if (log.topics[0] === spec.events["Transfer"].topic) {
    const event = spec.events["Transfer"].decode(log);
    return {
      from: event.from,
      to: event.to,
      contract: log.address,
      tokenId: event.tokenId.toString(),
      timestamp: log.block.timestamp,
    };
  }

  const error = new Error(`Unknown event "${log.topics[0]}"`);
  ctx.log.error(
    {
      error,
      blockNumber: log.block.height,
      blockHash: log.block.hash,
      address: log.address,
    },
    `Unable to decode event "${log.topics[0]}"`
  );
  throw error;
}
