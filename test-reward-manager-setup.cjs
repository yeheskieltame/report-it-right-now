// Test script to check RewardManager contract and appeal stake handling
const ethers = require('ethers');

const CONTRACT_ADDRESSES = {
  institusi: "0x48A5862D07E6b81D52C0a9911C8FEac275aFacB2",
  user: "0x3bfBCaf7E5d2E3b3b8A3Fc97F8e46eE4Dc55f59e",
  validator: "0xB193Afc274A54F8f83fA7FFE7612B0964adbd61E",
  rewardManager: "0x8461ad164980191D348e47aE73758533847D96d6",
  rtkToken: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
};

const REWARD_MANAGER_ABI = [
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
  }
];

async function testRewardManagerSetup() {
  try {
    console.log('=== TESTING REWARD MANAGER SETUP ===');
    
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const signer = new ethers.Wallet(adminPrivateKey, provider);
    
    console.log('Admin address:', await signer.getAddress());
    console.log('RewardManager address:', CONTRACT_ADDRESSES.rewardManager);
    
    const rewardManagerContract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, signer);
    
    // Check current setup
    console.log('\n1. Checking current RewardManager setup...');
    try {
      // Check if there are getter functions for the contract addresses
      console.log('Trying to get institusi contract from RewardManager...');
      
      // Get the contract bytecode to see what functions are available
      const code = await provider.getCode(CONTRACT_ADDRESSES.rewardManager);
      console.log('RewardManager has code:', code !== '0x');
      console.log('Code length:', code.length);
      
      // Try to call setContracts to properly setup the RewardManager
      console.log('\n2. Setting up contracts in RewardManager...');
      const tx = await rewardManagerContract.setContracts(
        CONTRACT_ADDRESSES.institusi,
        CONTRACT_ADDRESSES.user
      );
      
      console.log('Setup transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Setup transaction confirmed in block:', receipt.blockNumber);
      
      console.log('\n✅ RewardManager setup completed!');
      
    } catch (error) {
      console.error('Error in RewardManager setup:', error.message);
      
      // Try to diagnose the specific error
      if (error.message.includes('Hanya Institusi Contract')) {
        console.log('\n🔍 DIAGNOSIS: RewardManager is rejecting calls because it expects them to come from Institusi contract');
        console.log('This means the Institusi contract should be calling RewardManager functions, not directly');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testRewardManagerSetup().catch(console.error);
