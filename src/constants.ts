import { addr } from "./util";

export const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";
export const COSMO_START_BLOCK = 6363806;
export const CONTRACTS = {
  OBJEKT: addr("0x99bb83ae9bb0c0a6be865cacf67760947f91cb70"),
  COMO: addr("0xac361fa52f35aec4d6736800de5ebbd709cdcc6e"),
  GRAVITY: addr("0x68bcb9ffc1038c7b02d59313ec2a10b53c3fba19"),
} as const;
