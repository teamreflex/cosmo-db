import {
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  BlockHeader,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import * as contractAbi from "./abi/objekt";
import {
  CONTRACT_ARTMS,
  CONTRACT_TRIPLES,
  START_ARTMS,
  START_TRIPLES,
} from "./constants";

export const processor = new EvmBatchProcessor()
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
    },
  })
  .setFinalityConfirmation(100)
  // artms objekts
  .addLog({
    address: [CONTRACT_ARTMS],
    topic0: [contractAbi.events["Transfer"].topic],
    transaction: true,
    range: {
      from: START_ARTMS,
    },
  })
  // triples objekts
  .addLog({
    address: [CONTRACT_TRIPLES],
    topic0: [contractAbi.events["Transfer"].topic],
    transaction: true,
    range: {
      from: START_TRIPLES,
    },
  });

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
