import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import * as contractObjekt from "./abi/objekt";
import * as contractGovernor from "./abi/governor";
import * as contractComo from "./abi/como";
import { ARTISTS } from "./constants";
import { env } from "./env/processor";

console.log(
  `[processor] Starting processor with objekts ${env.ENABLE_OBJEKTS} & gravity ${env.ENABLE_GRAVITY}`
);

const processor = new EvmBatchProcessor()
  .setGateway("https://v2.archive.subsquid.io/network/polygon-mainnet")
  .setRpcEndpoint({
    url: env.RPC_ENDPOINT,
    rateLimit: env.RPC_RATE_LIMIT,
  })
  .setFields({
    log: {
      topics: true,
      data: true,
      transactionHash: true,
    },
    transaction: {
      input: true,
      sighash: true,
    },
  })
  .setFinalityConfirmation(env.RPC_FINALITY);

// add on per-artist options
for (const artist of ARTISTS) {
  processor
    // objekt transfers
    .addLog({
      address: [artist.contracts.Objekt],
      topic0: [contractObjekt.events.Transfer.topic],
      range: { from: artist.start },
    })
    // objekt transferability updates
    .addTransaction({
      to: [artist.contracts.Objekt],
      sighash: [
        contractObjekt.functions.batchUpdateObjektTransferrability.sighash,
      ],
      range: { from: artist.start },
    })
    // como transfers
    .addLog({
      address: [artist.contracts.Como],
      topic0: [contractComo.events.Transfer.topic],
      range: { from: artist.start },
    })
    // vote events
    .addLog({
      address: [artist.contracts.Governor],
      topic0: [contractGovernor.events.Voted.topic],
      range: { from: artist.start },
    })
    // vote reveal
    .addTransaction({
      to: [artist.contracts.Governor],
      sighash: [contractGovernor.functions.reveal.sighash],
      range: { from: artist.start },
    });
}

export { processor };
export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;
