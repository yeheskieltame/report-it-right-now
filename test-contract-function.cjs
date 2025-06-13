const { ethers } = require('ethers');

// Test if finalisasiBanding function exists in the contract
async function testContractFunction() {
  try {
    console.log('=== TESTING FINALISASI BANDING FUNCTION ===');
    
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const signer = new ethers.Wallet(adminPrivateKey, provider);
    
    const CONTRACT_ADDRESSES = {
      institusi: '0x48A5862D07E6b81D52C0a9911C8FEac275aFacB2'
    };
    
    // Minimal ABI just for testing
    const MINIMAL_ABI = [
      {
        "inputs": [
          {"internalType": "uint256", "name": "laporanId", "type": "uint256"},
          {"internalType": "bool", "name": "userMenang", "type": "bool"}
        ],
        "name": "finalisasiBanding",
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
    
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, MINIMAL_ABI, signer);
    
    console.log('Contract address:', CONTRACT_ADDRESSES.institusi);
    console.log('Signer address:', await signer.getAddress());
    
    // Test if we can call a view function first
    console.log('Testing view function...');
    try {
      const institutionData = await contract.getInstitusiData(1);
      console.log('Institution data:', institutionData);
    } catch (viewError) {
      console.error('View function failed:', viewError.message);
      return;
    }
    
    // Test gas estimation for finalisasiBanding
    console.log('Testing gas estimation for finalisasiBanding...');
    try {
      const gasEstimate = await contract.finalisasiBanding.estimateGas(6, true);
      console.log('Gas estimate successful:', gasEstimate.toString());
    } catch (gasError) {
      console.error('Gas estimation failed:', gasError.message);
      console.error('This indicates the function will revert or doesn\'t exist');
      
      // Check if it's a revert with specific reason
      if (gasError.message.includes('missing revert data')) {
        console.log('The function exists but would revert - checking why...');
        
        // Try to call it directly to get the revert reason
        try {
          await contract.finalisasiBanding.staticCall(6, true);
        } catch (staticCallError) {
          console.error('Static call error:', staticCallError.message);
        }
      }
    }
    
    // Check the actual bytecode at the contract address
    console.log('Checking contract bytecode...');
    const code = await provider.getCode(CONTRACT_ADDRESSES.institusi);
    console.log('Contract has code:', code !== '0x');
    console.log('Code length:', code.length);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testContractFunction();
