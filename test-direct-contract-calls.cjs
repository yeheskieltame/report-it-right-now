// Test script untuk memahami exact error di smart contract
const { ethers } = require('ethers');

const TARANIUM_RPC = 'https://testnet-rpc.taranium.com';
const CONTRACT_ADDRESSES = {
  institusi: '0x523764Cd8A212D37092a99C1e4f0A7192977936c',
  user: '0xEc4Bc28c308e21f119FAe768095aAe96d130537e'
};

const INSTITUSI_ABI = [
  "function adminFinalisasiBanding(uint256 laporanId, bool userMenang) external"
];

const USER_ABI = [
  "function finalisasiBanding(uint256 laporanId, bool userMenang) external",
  "function institusiContractAddress() external view returns (address)",
  "function laporan(uint256) external view returns (uint256 laporanId, uint256 institusiId, address pelapor, string memory judul, string memory deskripsi, string memory status, address validatorAddress, address assignedValidator, uint64 creationTimestamp)"
];

async function testDirectContractCall() {
  try {
    console.log('🧪 TESTING DIRECT CONTRACT CALLS');
    console.log('='.repeat(50));
    
    const provider = new ethers.JsonRpcProvider(TARANIUM_RPC);
    const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, provider);
    const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, provider);
    
    const reportId = 3;
    const userMenang = true;
    
    console.log(`📋 Testing with Report ID: ${reportId}, User Wins: ${userMenang}`);
    console.log('');
    
    // 1. Test direct call to adminFinalisasiBanding (without signer - will fail but show revert reason)
    console.log('🔍 Step 1: Testing adminFinalisasiBanding static call...');
    try {
      await institusiContract.adminFinalisasiBanding.staticCall(reportId, userMenang);
      console.log('✅ Static call would succeed');
    } catch (error) {
      console.log('❌ Static call failed:', error.reason || error.message);
      
      // Decode revert reason if available
      if (error.data) {
        try {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], error.data);
          console.log('🔍 Decoded revert reason:', decoded[0]);
        } catch (decodeError) {
          console.log('🔍 Raw error data:', error.data);
        }
      }
    }
    console.log('');
    
    // 2. Test what institution contract address is set in User contract
    console.log('🔍 Step 2: Checking User contract configuration...');
    const institusiContractAddr = await userContract.institusiContractAddress();
    console.log(`   User contract institusi address: ${institusiContractAddr}`);
    console.log(`   Expected institusi address: ${CONTRACT_ADDRESSES.institusi}`);
    console.log(`   Match: ${institusiContractAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase() ? '✅' : '❌'}`);
    console.log('');
    
    // 3. Test direct call to User contract finalisasiBanding
    console.log('🔍 Step 3: Testing User contract finalisasiBanding...');
    try {
      await userContract.finalisasiBanding.staticCall(reportId, userMenang);
      console.log('✅ User contract static call would succeed');
    } catch (error) {
      console.log('❌ User contract static call failed:', error.reason || error.message);
      
      if (error.reason === "Hanya Institusi Contract") {
        console.log('💡 This confirms the issue: User contract expects to be called by Institusi contract');
        console.log('   But there might be an issue in the Institusi->User call chain');
      }
    }
    console.log('');
    
    // 4. Check report data to see if there are any state issues
    console.log('🔍 Step 4: Checking report state...');
    const reportData = await userContract.laporan(reportId);
    console.log(`   Report status: ${reportData.status}`);
    console.log(`   Institution ID: ${reportData.institusiId}`);
    console.log(`   Validator address: ${reportData.validatorAddress}`);
    
    if (reportData.status !== 'Banding') {
      console.log('⚠️ WARNING: Report status is not "Banding"');
    }
    
    if (reportData.validatorAddress === ethers.ZeroAddress) {
      console.log('⚠️ WARNING: No validator address for slashing');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectContractCall().then(() => {
  console.log('\n✨ Test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
