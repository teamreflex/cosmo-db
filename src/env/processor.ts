import { z } from "zod";
import { baseEnvSchema } from "./base";

const envSchema = z
  .object({
    RPC_ENDPOINT: z.string().url(),
    ENABLE_OBJEKTS: z.preprocess((x) => x === "true", z.coerce.boolean()),
    ENABLE_GRAVITY: z.preprocess((x) => x === "true", z.coerce.boolean()),
  })
  .merge(baseEnvSchema);

export const env = envSchema.parse(process.env);
