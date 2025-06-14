// Test script to simulate appeal finalization and identify the exact error point
const ethers = require('ethers');

const CONTRACT_ADDRESSES = {
  institusi: "0x48A5862D07E6b81D52C0a9911C8FEac275aFacB2",
  user: "0x3bfBCaf7E5d2E3b3b8A3Fc97F8e46eE4Dc55f59e",
  validator: "0xB193Afc274A54F8f83fA7FFE7612B0964adbd61E",
  rewardManager: "0x8461ad164980191D348e47aE73758533847D96d6",
  rtkToken: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
};

// Minimal ABIs for testing
const INSTITUSI_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "bool", "name": "userMenang", "type": "bool"}
    ],
    "name": "adminFinalisasiBanding",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "institusiId", "type": "uint256"}],
    "name": "getInstitusiData",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const USER_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "laporanId", "type": "uint256"}],
    "name": "isBanding",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "laporan",
    "outputs": [
      {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
      {"internalType": "uint256", "name": "institusiId", "type": "uint256"},
      {"internalType": "string", "name": "judul", "type": "string"},
      {"internalType": "string", "name": "deskripsi", "type": "string"},
      {"internalType": "string", "name": "status", "type": "string"},
      {"internalType": "address", "name": "pelapor", "type": "address"},
      {"internalType": "uint64", "name": "creationTimestamp", "type": "uint64"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testAppealFinalization() {
  try {
    console.log('=== TESTING APPEAL FINALIZATION FLOW ===');
    
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const signer = new ethers.Wallet(adminPrivateKey, provider);
    
    console.log('Admin address:', await signer.getAddress());
    console.log('Contract addresses:', CONTRACT_ADDRESSES);
    
    // Test with a sample report ID (adjust as needed)
    const testReportId = 1;
    
    // Step 1: Check if there are any appeals
    const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, provider);
    
    console.log('\n1. Checking for appeals...');
    try {
      const isBanding = await userContract.isBanding(testReportId);
      console.log(`Report ${testReportId} is appeal case:`, isBanding);
      
      if (isBanding) {
        console.log('✅ Found appeal case, proceeding with test...');
      } else {
        console.log('⚠️  No appeal case found, simulating anyway...');
      }
    } catch (error) {
      console.log('❌ Error checking appeal status:', error.message);
    }
    
    // Step 2: Get report details
    console.log('\n2. Getting report details...');
    try {
      const laporan = await userContract.laporan(testReportId);
      console.log('Report details:', {
        id: laporan.laporanId.toString(),
        institusiId: laporan.institusiId.toString(),
        status: laporan.status,
        pelapor: laporan.pelapor
      });
    } catch (error) {
      console.log('❌ Error getting report details:', error.message);
      return;
    }
    
    // Step 3: Check admin permissions
    console.log('\n3. Checking admin permissions...');
    const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, provider);
    
    try {
      const [nama, admin, treasury] = await institusiContract.getInstitusiData(1); // Assuming institution ID 1
      console.log('Institution admin:', admin);
      console.log('Current signer:', await signer.getAddress());
      console.log('Is admin:', admin.toLowerCase() === (await signer.getAddress()).toLowerCase());
    } catch (error) {
      console.log('❌ Error checking admin permissions:', error.message);
    }
    
    // Step 4: Test gas estimation (this will show us where the error occurs)
    console.log('\n4. Testing gas estimation for adminFinalisasiBanding...');
    const institusiContractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, signer);
    
    try {
      console.log('Estimating gas for adminFinalisasiBanding(1, true)...');
      const gasEstimate = await institusiContractWithSigner.adminFinalisasiBanding.estimateGas(testReportId, true);
      console.log('✅ Gas estimation successful:', gasEstimate.toString());
      console.log('This suggests the function should work without issues.');
      
      // If gas estimation works, try the actual call
      console.log('\n5. Attempting actual function call...');
      const tx = await institusiContractWithSigner.adminFinalisasiBanding(testReportId, true);
      console.log('✅ Transaction sent:', tx.hash);
      
      console.log('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
    } catch (error) {
      console.log('❌ Gas estimation or function call failed:', error.message);
      console.log('Error details:', error);
      
      // Analyze the specific error
      if (error.message.includes('Hanya Institusi Contract')) {
        console.log('\n🔍 ANALYSIS: "Hanya Institusi Contract" error detected');
        console.log('This means:');
        console.log('1. The Institusi contract is calling User contract successfully');
        console.log('2. But User contract is calling RewardManager functions that expect Institusi contract calls');
        console.log('3. The RewardManager has access control that only allows Institusi contract calls');
        console.log('\n💡 SOLUTION: RewardManager needs to be configured to accept User contract calls');
        console.log('OR: User contract should not call RewardManager directly');
        console.log('OR: Appeal stake should be handled differently');
      } else if (error.message.includes('missing revert data')) {
        console.log('\n🔍 ANALYSIS: Function might not exist or has access control issues');
      } else if (error.message.includes('execution reverted')) {
        console.log('\n🔍 ANALYSIS: Function exists but reverted due to business logic');
      }
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Test setup failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testAppealFinalization().catch(console.error);
}

module.exports = { testAppealFinalization };
