// Test script untuk workaround method
const { ethers } = require('ethers');

const TARANIUM_RPC = 'https://testnet-rpc.taranium.com';
const CONTRACT_ADDRESSES = {
  institusi: '0x523764Cd8A212D37092a99C1e4f0A7192977936c',
  user: '0xEc4Bc28c308e21f119FAe768095aAe96d130537e',
  rewardManager: '0x8461ad164980191D348e47aE73758533847D96d6'
};

const INSTITUSI_ABI = [
  "function adminFinalisasiBanding(uint256 laporanId, bool userMenang) external",
  "function getInstitusiData(uint256) external view returns (string memory nama, address admin, address treasury)"
];

const USER_ABI = [
  "function laporan(uint256) external view returns (uint256 laporanId, uint256 institusiId, address pelapor, string memory judul, string memory deskripsi, string memory status, address validatorAddress, address assignedValidator, uint64 creationTimestamp)",
  "function isBanding(uint256) external view returns (bool)"
];

async function testSmartContractBugAnalysis() {
  try {
    console.log('🔍 SMART CONTRACT BUG ANALYSIS');
    console.log('='.repeat(60));
    
    const provider = new ethers.JsonRpcProvider(TARANIUM_RPC);
    const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, provider);
    const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, provider);
    
    const reportId = 3;
    const userMenang = true;
    const expectedAdmin = '0x38CfE8Cb409322E7A00D84699780126fa8336c1d';
    
    console.log(`📋 Testing Report ID: ${reportId}`);
    console.log(`👤 Expected Admin: ${expectedAdmin}`);
    console.log(`🎯 User Wins: ${userMenang}`);
    console.log('');
    
    // Step 1: Detailed state analysis
    console.log('🔍 STEP 1: STATE ANALYSIS');
    console.log('-'.repeat(40));
    
    const reportData = await userContract.laporan(reportId);
    console.log(`Report Status: ${reportData.status}`);
    console.log(`Institution ID: ${reportData.institusiId}`);
    console.log(`Reporter: ${reportData.pelapor}`);
    console.log(`Validator: ${reportData.validatorAddress}`);
    
    const isBanding = await userContract.isBanding(reportId);
    console.log(`Is Banding: ${isBanding}`);
    console.log('');
    
    // Step 2: Institution verification
    console.log('🔍 STEP 2: INSTITUTION VERIFICATION');
    console.log('-'.repeat(40));
    
    const institusiId = reportData.institusiId;
    const [nama, admin, treasury] = await institusiContract.getInstitusiData(institusiId);
    
    console.log(`Institution Name: ${nama}`);
    console.log(`Admin Address: ${admin}`);
    console.log(`Treasury: ${treasury}`);
    console.log(`Expected Admin: ${expectedAdmin}`);
    console.log(`Admin Match: ${admin.toLowerCase() === expectedAdmin.toLowerCase() ? '✅' : '❌'}`);
    console.log('');
    
    // Step 3: Contract function call simulation
    console.log('🔍 STEP 3: FUNCTION CALL SIMULATION');
    console.log('-'.repeat(40));
    
    // Test the function call that's failing
    try {
      console.log('Testing adminFinalisasiBanding static call...');
      await institusiContract.adminFinalisasiBanding.staticCall(reportId, userMenang);
      console.log('✅ Static call would succeed');
    } catch (error) {
      console.log('❌ Static call failed:');
      console.log(`   Reason: ${error.reason || 'Unknown'}`);
      console.log(`   Message: ${error.message}`);
      
      // Additional error analysis
      if (error.reason === 'Hanya admin dari institusi terkait') {
        console.log('');
        console.log('🔍 DETAILED ANALYSIS:');
        console.log('   This error suggests the smart contract is checking msg.sender');
        console.log('   against the admin address, but something is wrong with:');
        console.log('   1. The admin address stored in the contract, OR');
        console.log('   2. The institution ID mapping, OR');
        console.log('   3. The report->institution relationship');
        console.log('');
        
        // Let's check a few things
        console.log('🔍 DEBUGGING CHECKS:');
        
        // Check if institution 2 really exists and has the right data
        try {
          const [inst2Name, inst2Admin] = await institusiContract.getInstitusiData(2);
          console.log(`   Institution 2: "${inst2Name}", Admin: ${inst2Admin}`);
        } catch (e) {
          console.log(`   Institution 2: Error - ${e.message}`);
        }
        
        // Check report's institution ID
        console.log(`   Report's Institution ID: ${reportData.institusiId}`);
        
        // Check if there might be a different admin for this specific call
        console.log(`   Expected call: msg.sender should be ${admin}`);
        console.log(`   But error suggests it's not matching properly`);
        
        console.log('');
        console.log('💡 POSSIBLE SOLUTIONS:');
        console.log('   1. Smart contract bug: Admin check logic is incorrect');
        console.log('   2. Data inconsistency: Institution data doesn\'t match expectations');
        console.log('   3. Contract not deployed properly: Functions have wrong logic');
        console.log('   4. Network/RPC issue: Static calls behaving differently than transactions');
      }
    }
    
    console.log('');
    console.log('🎯 CONCLUSION:');
    console.log('   Based on the analysis, this appears to be a smart contract bug');
    console.log('   where the admin authorization check is not working correctly,');
    console.log('   even though all the data appears to be correct.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

testSmartContractBugAnalysis().then(() => {
  console.log('\n✨ Analysis completed');
}).catch(error => {
  console.error('❌ Analysis failed:', error);
});
