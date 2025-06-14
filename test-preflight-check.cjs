// Test script for the new pre-flight check functionality
const { ethers } = require('ethers');

// Test configuration (using your contract addresses)
const TARANIUM_RPC = 'https://testnet-rpc.taranium.com';
const CONTRACT_ADDRESSES = {
  rtkToken: '0xEfAEB0a500c5329D70cD1323468f1E906b4962e3',
  rewardManager: '0x8461ad164980191D348e47aE73758533847D96d6',
  institusi: '0x523764Cd8A212D37092a99C1e4f0A7192977936c',
  user: '0xEc4Bc28c308e21f119FAe768095aAe96d130537e',
  validator: '0xB193Afc274A54F8f83fA7FFE7612B0964adbd61E'
};

// Minimal ABI for testing
const USER_ABI = [
  "function laporan(uint256) external view returns (uint256 laporanId, uint256 institusiId, address pelapor, string memory judul, string memory deskripsi, string memory status, address validatorAddress, address assignedValidator, uint64 creationTimestamp)",
  "function isBanding(uint256) external view returns (bool)",
  "function STAKE_BANDING_AMOUNT() external view returns (uint256)",
  "function institusiContractAddress() external view returns (address)"
];

const INSTITUSI_ABI = [
  "function getInstitusiData(uint256) external view returns (string memory nama, address admin, address treasury)",
  "function adminFinalisasiBanding(uint256 laporanId, bool userMenang) external"
];

const RTK_ABI = [
  "function balanceOf(address) external view returns (uint256)"
];

async function testPreFlightCheck() {
  try {
    console.log('🧪 Testing Pre-Flight Check Implementation');
    console.log('='.repeat(50));
    
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(TARANIUM_RPC);
    console.log('✅ Connected to Taranium testnet');
    
    // Test contracts
    const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, provider);
    const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, provider);
    const rtkContract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTK_ABI, provider);
    
    console.log('✅ Contract instances created');
    
    // Test with a sample report ID (assuming report 1 exists)
    const testReportId = 1;
    console.log(`\n🔍 Testing pre-flight checks for Report ID: ${testReportId}`);
    
    try {
      // Simulate the pre-flight checks
      console.log('\n1. 📋 Getting report data...');
      const reportData = await userContract.laporan(testReportId);
      console.log(`   ✅ Report found: ID=${reportData.laporanId}, Status="${reportData.status}", InstitusiID=${reportData.institusiId}`);
      
      console.log('\n2. 🏢 Getting institution data...');
      const [nama, admin, treasury] = await institusiContract.getInstitusiData(reportData.institusiId);
      console.log(`   ✅ Institution: "${nama}", Admin: ${admin}, Treasury: ${treasury}`);
      
      console.log('\n3. 📊 Checking appeal status...');
      const isBandingStatus = await userContract.isBanding(testReportId);
      console.log(`   ✅ Is in appeal status: ${isBandingStatus}`);
      
      console.log('\n4. 🔗 Checking contract connections...');
      const institusiContractAddr = await userContract.institusiContractAddress();
      const isConnected = institusiContractAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase();
      console.log(`   ✅ User contract connected to Institusi: ${isConnected}`);
      console.log(`   📝 Expected: ${CONTRACT_ADDRESSES.institusi}`);
      console.log(`   📝 Actual: ${institusiContractAddr}`);
      
      console.log('\n5. 💰 Checking RewardManager balance...');
      const rewardManagerBalance = await rtkContract.balanceOf(CONTRACT_ADDRESSES.rewardManager);
      const stakeAmount = await userContract.STAKE_BANDING_AMOUNT();
      console.log(`   ✅ RewardManager balance: ${ethers.formatEther(rewardManagerBalance)} RTK`);
      console.log(`   ✅ Required stake amount: ${ethers.formatEther(stakeAmount)} RTK`);
      console.log(`   ✅ Sufficient balance: ${rewardManagerBalance >= stakeAmount}`);
      
      console.log('\n6. ⛽ Testing gas estimation...');
      try {
        // This will fail without a signer, but that's expected
        const gasEstimate = await institusiContract.adminFinalisasiBanding.estimateGas(testReportId, true);
        console.log(`   ✅ Gas estimation: ${gasEstimate.toString()}`);
      } catch (gasError) {
        console.log(`   ⚠️ Gas estimation failed (expected without signer): ${gasError.message.substring(0, 100)}...`);
      }
      
      console.log('\n🎉 Pre-flight check simulation completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   • Report ID: ${testReportId}`);
      console.log(`   • Institution: ${nama}`);
      console.log(`   • Admin required: ${admin}`);
      console.log(`   • Appeal status: ${isBandingStatus ? 'Active' : 'Not active'}`);
      console.log(`   • Contract setup: ${isConnected ? 'Valid' : 'Invalid'}`);
      console.log(`   • RewardManager funds: ${rewardManagerBalance >= stakeAmount ? 'Sufficient' : 'Insufficient'}`);
      
    } catch (error) {
      console.error('❌ Error during pre-flight check simulation:', error.message);
      
      // Try to get more details
      if (error.message.includes('call revert exception')) {
        console.log('💡 This might indicate that the report doesn\'t exist or contracts aren\'t properly deployed');
      }
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

// Run the test
testPreFlightCheck().then(() => {
  console.log('\n✨ Test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
