import * as spec from "./abi/objekt";
import { Log } from "./processor";
import { addr } from "./util";

export type TransferEvent = {
  contract: string;
  from: string;
  to: string;
  tokenId: string;
  timestamp: number;
};

export function parseEvent(log: Log): TransferEvent | undefined {
  try {
    if (log.topics[0] === spec.events["Transfer"].topic) {
      const event = spec.events["Transfer"].decode(log);
      return {
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
