// Debug script untuk verifikasi institution mismatch
const { ethers } = require('ethers');

const TARANIUM_RPC = 'https://testnet-rpc.taranium.com';
const CONTRACT_ADDRESSES = {
  institusi: '0x523764Cd8A212D37092a99C1e4f0A7192977936c',
  user: '0xEc4Bc28c308e21f119FAe768095aAe96d130537e'
};

const USER_ABI = [
  "function laporan(uint256) external view returns (uint256 laporanId, uint256 institusiId, address pelapor, string memory judul, string memory deskripsi, string memory status, address validatorAddress, address assignedValidator, uint64 creationTimestamp)"
];

const INSTITUSI_ABI = [
  "function getInstitusiData(uint256) external view returns (string memory nama, address admin, address treasury)"
];

async function debugInstitutionMismatch() {
  try {
    console.log('🔍 DEBUGGING INSTITUTION MISMATCH');
    console.log('='.repeat(50));
    
    const provider = new ethers.JsonRpcProvider(TARANIUM_RPC);
    const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, provider);
    const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, provider);
    
    const reportId = 3;
    const signerAddress = '0x38CfE8Cb409322E7A00D84699780126fa8336c1d';
    
    console.log(`📋 Report ID: ${reportId}`);
    console.log(`👤 Current User: ${signerAddress}`);
    console.log('');
    
    // Get report data
    const reportData = await userContract.laporan(reportId);
    console.log('📊 REPORT DATA:');
    console.log(`   Report ID: ${reportData.laporanId}`);
    console.log(`   Institution ID: ${reportData.institusiId}`);
    console.log(`   Reporter: ${reportData.pelapor}`);
    console.log(`   Status: ${reportData.status}`);
    console.log('');
    
    // Check institution data for the report's institution
    const reportInstitusiId = reportData.institusiId;
    const [nama, admin, treasury] = await institusiContract.getInstitusiData(reportInstitusiId);
    
    console.log('🏛️ REPORT\'S INSTITUTION DATA:');
    console.log(`   Institution ID: ${reportInstitusiId}`);
    console.log(`   Name: ${nama}`);
    console.log(`   Admin: ${admin}`);
    console.log(`   Treasury: ${treasury}`);
    console.log('');
    
    // Check if current user is admin of this institution
    const isAdmin = admin.toLowerCase() === signerAddress.toLowerCase();
    console.log('🔐 AUTHORIZATION CHECK:');
    console.log(`   Current user: ${signerAddress}`);
    console.log(`   Institution admin: ${admin}`);
    console.log(`   Is admin: ${isAdmin ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    if (!isAdmin) {
      console.log('💡 SOLUTION: You need to:');
      console.log('   1. Use the correct admin wallet for this institution, OR');
      console.log('   2. Create a new institution with your current wallet as admin');
      console.log('');
      
      // Show how to check which institutions the current user is admin of
      console.log('🔍 Checking which institutions you are admin of...');
      for (let i = 1; i <= 5; i++) { // Check first 5 institutions
        try {
          const [instNama, instAdmin] = await institusiContract.getInstitusiData(i);
          if (instAdmin.toLowerCase() === signerAddress.toLowerCase()) {
            console.log(`   ✅ Institution ${i}: "${instNama}" - You are admin`);
          } else {
            console.log(`   ❌ Institution ${i}: "${instNama}" - Admin: ${instAdmin}`);
          }
        } catch (error) {
          console.log(`   ⚪ Institution ${i}: Does not exist`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugInstitutionMismatch().then(() => {
  console.log('\n✨ Debug completed');
}).catch(error => {
  console.error('❌ Debug failed:', error);
});
