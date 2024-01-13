import {
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  BlockHeader,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import * as contractAbi from "./abi/objekt";
import { ARTISTS } from "./constants";

const processor = new EvmBatchProcessor()
  // default options
  .setDataSource({
    archive: lookupArchive("polygon", { type: "EVM" }),
    chain: "https://polygon-rpc.com",
  })
  .setFields({
    log: {
      topics: true,
      data: true,
      transactionHash: true,
    },
    transaction: {
      hash: true,
      input: true,
      from: true,
      value: true,
      status: true,
      sighash: true,
    },
  })
  .setFinalityConfirmation(200);

// add on per-artist options
for (const artist of ARTISTS) {
  processor
    .addLog({
      address: [artist.contract],
      topic0: [contractAbi.events["Transfer"].topic],
      transaction: true,
      range: {
        from: artist.start,
      },
    })
    .addTransaction({
      to: [artist.contract],
      sighash: [
        contractAbi.functions.batchUpdateObjektTransferrability.sighash,
      ],
      range: {
        from: artist.start,
      },
    });
}

export { processor };
export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
