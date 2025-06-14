export const TARANIUM_NETWORK = {
  chainId: '0x26C4', // 9924 in hex
  chainName: 'Taranium Testnet',
  nativeCurrency: {
    name: 'TARAN',
    symbol: 'TARAN',
    decimals: 18
  },
  rpcUrls: ['https://testnet-rpc.taranium.com'],
  blockExplorerUrls: ['https://testnet.taranium.com']
};

export const CONTRACT_ADDRESSES = {
  rtkToken: '0xEfAEB0a500c5329D70cD1323468f1E906b4962e3',
  rewardManager: '0x8461ad164980191D348e47aE73758533847D96d6',
  institusi: '0x523764Cd8A212D37092a99C1e4f0A7192977936c',
  user: '0xEc4Bc28c308e21f119FAe768095aAe96d130537e',
  validator: '0xB193Afc274A54F8f83fA7FFE7612B0964adbd61E',
  tokenSale:''
};
export const TOKENSALE_ABI =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_rtkTokenAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_tokenPriceInWei",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountETH",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountRTK",
				"type": "uint256"
			}
		],
		"name": "TokensPurchased",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_buyer",
				"type": "address"
			}
		],
		"name": "buyTokens",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "rtkToken",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_newTokenPriceInWei",
				"type": "uint256"
			}
		],
		"name": "setTokenPrice",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "tokenPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawETH",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawUnsoldRTK",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
];
export const USER_ABI =[
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "pelapor",
				"type": "address"
			}
		],
		"name": "BandingDiajukan",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "institusi",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "rewardManager",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "rtkToken",
				"type": "address"
			}
		],
		"name": "ContractsSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "pelapor",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			}
		],
		"name": "LaporanBaru",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "status",
				"type": "string"
			}
		],
		"name": "StatusLaporanDiupdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			}
		],
		"name": "ValidatorDitugaskan",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "STAKE_BANDING_AMOUNT",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "activeAssignmentsCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			}
		],
		"name": "ajukanBanding",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "judul",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "deskripsi",
				"type": "string"
			}
		],
		"name": "buatLaporan",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "validator",
				"type": "address"
			}
		],
		"name": "completeAssignment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "userMenang",
				"type": "bool"
			}
		],
		"name": "finalisasiBanding",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			}
		],
		"name": "getLaporanDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "assignedValidator",
				"type": "address"
			},
			{
				"internalType": "uint64",
				"name": "creationTimestamp",
				"type": "uint64"
			},
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "institusiContract",
		"outputs": [
			{
				"internalType": "contract IInstitusiContract",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "institusiContractAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "isBanding",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "laporan",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "pelapor",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "judul",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "deskripsi",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "status",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "validatorAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "assignedValidator",
				"type": "address"
			},
			{
				"internalType": "uint64",
				"name": "creationTimestamp",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "laporanCounter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "rewardManager",
		"outputs": [
			{
				"internalType": "contract IRewardManager",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "rtkToken",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_institusi",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_rewardManager",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_validator",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_rtkToken",
				"type": "address"
			}
		],
		"name": "setContracts",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "newStatus",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "_validatorAddress",
				"type": "address"
			}
		],
		"name": "updateStatus",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "validatorContract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
export const VALIDATOR_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "userContract",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "institusiContract",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "rewardManager",
				"type": "address"
			}
		],
		"name": "ContractsSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			}
		],
		"name": "ValidasiDilakukan",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			}
		],
		"name": "ValidatorDiregistrasi",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "hasilValidasi",
		"outputs": [
			{
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "deskripsi",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "institusiContract",
		"outputs": [
			{
				"internalType": "contract IInstitusiContract",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "institusiContractAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "laporanSudahDivalidasi",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_validator",
				"type": "address"
			}
		],
		"name": "registerValidator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			}
		],
		"name": "resignFromInstitusi",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "rewardManager",
		"outputs": [
			{
				"internalType": "contract IRewardManager",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_institusi",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_rewardManager",
				"type": "address"
			}
		],
		"name": "setContracts",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "userContract",
		"outputs": [
			{
				"internalType": "contract IUserContract",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "deskripsi",
				"type": "string"
			}
		],
		"name": "validasiLaporan",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			}
		],
		"name": "laporanSudahDivalidasi",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			}
		],
		"name": "getValidasiStructData",
		"outputs": [
			{
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isValid",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "deskripsi",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "hasIssues",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "dataSource",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "rawData",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
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
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
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
  },
  {
    "inputs": [{"internalType": "uint256", "name": "laporanId", "type": "uint256"}],
    "name": "getContributionLevel",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "uint256", "name": "level", "type": "uint256"}
    ],
    "name": "setContributionLevel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "address", "name": "validator", "type": "address"}
    ],
    "name": "hasValidatorClaimedReward",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_STAKE_AMOUNT",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "BASE_REWARD_PER_LEVEL",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "validator", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "slashValidator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"}
    ],
    "name": "returnStakeToPelapor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"}
    ],
    "name": "returnStakeToValidator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "address", "name": "winner", "type": "address"}
    ],
    "name": "transferStakeToWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "institusiContract",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "userContract",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
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
  }
];

export const INSTITUSI_ABI =[
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "validatorContractAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "rewardManagerAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "userContractAddress",
				"type": "address"
			}
		],
		"name": "ContractsSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "admin",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "nama",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "treasury",
				"type": "address"
			}
		],
		"name": "InstitusiBaru",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "pelapor",
				"type": "address"
			}
		],
		"name": "PelaporDitambahkan",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newReputation",
				"type": "uint256"
			}
		],
		"name": "ReputasiDiperbarui",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			}
		],
		"name": "ValidatorDihapus",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "validator",
				"type": "address"
			}
		],
		"name": "ValidatorDitambahkan",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "userMenang",
				"type": "bool"
			}
		],
		"name": "adminFinalisasiBanding",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "laporanId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "level",
				"type": "uint256"
			}
		],
		"name": "adminSetContribution",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_nama",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "_treasury",
				"type": "address"
			}
		],
		"name": "daftarInstitusi",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			}
		],
		"name": "getInstitusiData",
		"outputs": [
			{
				"internalType": "string",
				"name": "nama",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "admin",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "treasury",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			}
		],
		"name": "getValidatorList",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "hukumValidatorCurang",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "institusi",
		"outputs": [
			{
				"internalType": "string",
				"name": "nama",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "admin",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "treasury",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "institusiCounter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isPelaporTerdaftar",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isValidatorTerdaftar",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "validatorAddress",
				"type": "address"
			}
		],
		"name": "removeValidator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "rewardManager",
		"outputs": [
			{
				"internalType": "contract IRewardManager",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_validatorContract",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_rewardManagerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_userContract",
				"type": "address"
			}
		],
		"name": "setContracts",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_pelapor",
				"type": "address"
			}
		],
		"name": "tambahPelapor",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "institusiId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_validator",
				"type": "address"
			}
		],
		"name": "tambahValidator",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "validator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "score",
				"type": "uint256"
			}
		],
		"name": "updateReputation",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "userContract",
		"outputs": [
			{
				"internalType": "contract IUserContract",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "validatorContract",
		"outputs": [
			{
				"internalType": "contract IValidatorContract",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "validatorContractAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "validatorList",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "validatorReputation",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]