
export const TARANIUM_NETWORK = {
  chainId: '0x26C4', // 9924 in hex
  chainName: 'Taranium Testnet',
  nativeCurrency: {
    name: 'TARAN',
    symbol: 'TARAN',
    decimals: 18
  },
  rpcUrls: ['https://testnet-rpc.taranium.com'],
  blockExplorerUrls: ['https://testnet.taranium.com'] // Assuming block explorer exists
};

export const CONTRACT_ADDRESSES = {
  rtkToken: '0xEfAEB0a500c5329D70cD1323468f1E906b4962e3',
  rewardManager: '0x641D0Bf2936E2183443c60513b1094Ff5E39D42F',
  institusi: '0x48A5862D07E6b81D52C0a9911C8FEac275aFacB2',
  user: '0xAaeECCAe4203F94f634B349bB82D61b1f6F34FE5',
  validator: '0xABAa1C01c026849F7eDc9C212c78a6b1D353d58b'
};

export const RTKT_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const REWARD_MANAGER_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "depositRTK",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_institusiContract", "type": "address"},
      {"internalType": "address", "name": "_userContract", "type": "address"}
    ],
    "name": "setContracts",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "validator", "type": "address"}],
    "name": "getStakedAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "laporanId", "type": "uint256"}],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const INSTITUSI_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "institusiId", "type": "uint256"}],
    "name": "getInstitusiData",
    "outputs": [
      {"internalType": "string", "name": "nama", "type": "string"},
      {"internalType": "address", "name": "admin", "type": "address"},
      {"internalType": "address", "name": "treasury", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "institusiCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "institusiId", "type": "uint256"},
      {"internalType": "address", "name": "_validator", "type": "address"}
    ],
    "name": "tambahValidator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "institusiId", "type": "uint256"},
      {"internalType": "address", "name": "_pelapor", "type": "address"}
    ],
    "name": "tambahPelapor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "name": "isValidatorTerdaftar",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "name": "isPelaporTerdaftar",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const USER_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "institusiId", "type": "uint256"},
      {"internalType": "string", "name": "judul", "type": "string"},
      {"internalType": "string", "name": "deskripsi", "type": "string"}
    ],
    "name": "buatLaporan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "laporanId", "type": "uint256"}],
    "name": "ajukanBanding",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "laporan",
    "outputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "uint256", "name": "institusiId", "type": "uint256"},
      {"internalType": "address", "name": "pelapor", "type": "address"},
      {"internalType": "string", "name": "judul", "type": "string"},
      {"internalType": "string", "name": "deskripsi", "type": "string"},
      {"internalType": "string", "name": "status", "type": "string"},
      {"internalType": "address", "name": "validatorAddress", "type": "address"},
      {"internalType": "address", "name": "assignedValidator", "type": "address"},
      {"internalType": "uint64", "name": "creationTimestamp", "type": "uint64"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "laporanCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const VALIDATOR_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "bool", "name": "isValid", "type": "bool"},
      {"internalType": "string", "name": "deskripsi", "type": "string"}
    ],
    "name": "validasiLaporan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "institusiId", "type": "uint256"}],
    "name": "resignFromInstitusi",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
