import { addr } from "./util";

export const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";

// TODO: if/when new artists are regularly added, just pull from api
export const ARTISTS = [
  // tripleS
  {
    contracts: {
      Como: "0x58AeABfE2D9780c1bFcB713Bf5598261b15dB6e5",
      ComoMinter: "0x1f6Be90bCb84523beF86E8cD1E8F1944Ca30eb5F",
      CommunityPool: "0xdAE81c4c069c86fea2FC08cfD53a4201D661e447",
      Objekt: "0xA4B37bE40F7b231Ee9574c4b16b7DDb7EAcDC99B",
      ObjektMinter: "0x3D898E02DFA77a1Ef69Ab8Ec369200a2e48DC5E3",
      Governor: "0xc3E5ad11aE2F00c740E74B81f134426A3331D950",
    },
    start: 29388703,
  },
  // ARTMS
  {
    contracts: {
      Como: "0x8254D8D2903B20187cBC4Dd833d49cECc219F32E",
      ComoMinter: "0x9640531cA96691b7F38e88fA17badAD90534d2A5",
      CommunityPool: "0x07F93cCc90aF32E4d6ea70A93F36DF9F58C97087",
      Objekt: "0x0fB69F54bA90f17578a59823E09e5a1f8F3FA200",
      ObjektMinter: "0x9009e2b4fc02eb18e41994d235a78504600AC87c",
      Governor: "0x8466e6E218F0fe438Ac8f403f684451D20E59Ee3",
    },
    start: 44048396,
  },
];

type ContractType = keyof (typeof ARTISTS)[number]["contracts"];

// group contracts by type
export const CONTRACTS = Object.fromEntries(
  [...new Set(ARTISTS.flatMap((artist) => Object.keys(artist.contracts)))].map(
    (key) => [
      key,
      ARTISTS.map((artist) => addr(artist.contracts[key as ContractType])),
    ]
  )
) as Record<ContractType, string[]>;
