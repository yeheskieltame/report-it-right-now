// Test script to debug appeal finalization
import { ethers } from 'ethers';

// This is a Node.js test script to verify our appeal logic
// Run with: node test-appeal-debug.js

const CONTRACT_ADDRESSES = {
  institusi: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  user: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  validator: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  rewardManager: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  rtkToken: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
};

const INSTITUSI_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "bool", "name": "userMenang", "type": "bool"}
    ],
    "name": "finalisasiBanding",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function testAppealLogic() {
  console.log('Testing appeal finalization logic...');
  console.log('Contract addresses:', CONTRACT_ADDRESSES);
  console.log('INSTITUSI_ABI function:', INSTITUSI_ABI[0]);
  
  // Test ABI encoding
  const contract = new ethers.Interface(INSTITUSI_ABI);
  const encoded = contract.encodeFunctionData('finalisasiBanding', [1, true]);
  console.log('Encoded function call:', encoded);
  
  // Test decoding
  const decoded = contract.decodeFunctionData('finalisasiBanding', encoded);
  console.log('Decoded parameters:', decoded);
  
  console.log('Appeal logic test completed successfully!');
}

// Run the test
testAppealLogic().catch(console.error);
