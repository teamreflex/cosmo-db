export const ABI_JSON = [
  {
    type: "function",
    name: "name",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [
      {
        type: "string",
        name: "",
      },
    ],
  },
  {
    type: "function",
    name: "approve",
    constant: false,
    payable: false,
    inputs: [
      {
        type: "address",
        name: "account",
      },
      {
        type: "uint256",
        name: "value",
      },
    ],
    outputs: [
      {
        type: "bool",
        name: "",
      },
    ],
  },
  {
    type: "function",
    name: "totalSupply",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [
      {
        type: "uint256",
        name: "",
      },
    ],
  },
  {
    type: "function",
    name: "transferFrom",
    constant: false,
    payable: false,
    inputs: [
      {
        type: "address",
        name: "from",
      },
      {
        type: "address",
        name: "to",
      },
      {
        type: "uint256",
        name: "value",
      },
    ],
    outputs: [
      {
        type: "bool",
        name: "",
      },
    ],
  },
  {
    type: "function",
    name: "decimals",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [
      {
        type: "uint8",
        name: "",
      },
    ],
  },
  {
    type: "function",
    name: "balanceOf",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [
      {
        type: "address",
        name: "owner",
      },
    ],
    outputs: [
      {
        type: "uint256",
        name: "balance",
      },
    ],
  },
  {
    type: "function",
    name: "symbol",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [
      {
        type: "string",
        name: "",
      },
    ],
  },
  {
    type: "function",
    name: "transfer",
    constant: false,
    payable: false,
    inputs: [
      {
        type: "address",
        name: "to",
      },
      {
        type: "uint256",
        name: "value",
      },
    ],
    outputs: [
      {
        type: "bool",
        name: "",
      },
    ],
  },
  {
    type: "function",
    name: "allowance",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [
      {
        type: "address",
        name: "owner",
      },
      {
        type: "address",
        name: "account",
      },
    ],
    outputs: [
      {
        type: "uint256",
        name: "",
      },
    ],
  },
  {
    type: "fallback",
    stateMutability: "payable",
  },
  {
    type: "event",
    anonymous: false,
    name: "Approval",
    inputs: [
      {
        type: "address",
        name: "owner",
        indexed: true,
      },
      {
        type: "address",
        name: "account",
        indexed: true,
      },
      {
        type: "uint256",
        name: "value",
        indexed: false,
      },
    ],
  },
  {
    type: "event",
    anonymous: false,
    name: "Transfer",
    inputs: [
      {
        type: "address",
        name: "from",
        indexed: true,
      },
      {
        type: "address",
        name: "to",
        indexed: true,
      },
      {
        type: "uint256",
        name: "value",
        indexed: false,
      },
    ],
  },
];