import { BlockData } from "@subsquid/evm-processor";

/**
 * lower cases the incoming address
 */
export const addr = (address: string) => address.toLowerCase();

/**
 * check if both addresses match
 */
export const matches = (a: string, b: string) => addr(a) === addr(b);

/**
 * Convert UNIX timestamp to Postgres timestamp.
 */
export function timestamp(timestamp: number) {
  return new Date(timestamp).toISOString().replace("T", " ").replace("Z", "");
}

export type ConfiguredBlock = BlockData<{
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
