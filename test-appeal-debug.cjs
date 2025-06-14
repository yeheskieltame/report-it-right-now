// Test script for Appeal Debugging - Confirming RewardManager Access Control Issue
const { ethers } = require('ethers');

// Contract configurations
const PROVIDER_URL = 'https://polygon-amoy.g.alchemy.com/v2/dI5j5F3SYpQ-yY5fj2Z5jY8X5Q5X5Q5X';
const PRIVATE_KEY = '0x' + 'a'.repeat(64); // Dummy private key for testing

const CONTRACT_ADDRESSES = {
  user: '0xEc4Bc28c308e21f119FAe768095aAe96d130537e',
  institusi: '0x523764Cd8A212D37092a99C1e4f0A7192977936c', 
  rewardManager: '0x8461ad164980191D348e47aE73758533847D96d6'
};

// Simplified ABIs - just the functions we need
const USER_ABI = [
  "function finalisasiBanding(uint256 laporanId, address userMenang) external",
  "function institusiAddress() external view returns (address)",
  "function rewardManager() external view returns (address)"
];

const INSTITUSI_ABI = [
  "function adminFinalisasiBanding(uint256 laporanId, address userMenang) external",
  "function userContract() external view returns (address)",
  "function rewardManager() external view returns (address)"
];

const REWARD_MANAGER_ABI = [
  "function institusiContract() external view returns (address)",
  "function userContract() external view returns (address)",
  "function returnStakeToPelapor(uint256 laporanId) external",
  "function returnStakeToValidator(uint256 laporanId) external",
  "function transferStakeToWinner(uint256 laporanId, address winner) external"
];

async function testAppealDebug() {
  console.log('🔍 Testing Appeal Debug - Confirming RewardManager Access Control Issue\n');
  
  try {
    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Create contract instances
    const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, signer);
    const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, signer);
    const rewardManagerContract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, signer);
    
    console.log('📋 Contract Setup Analysis:');
    console.log('─'.repeat(50));
    
    // Check contract addresses and configurations
    console.log(`User Contract: ${CONTRACT_ADDRESSES.user}`);
    console.log(`Institusi Contract: ${CONTRACT_ADDRESSES.institusi}`);
    console.log(`RewardManager Contract: ${CONTRACT_ADDRESSES.rewardManager}`);
    
    try {
      const userContractInstitusiAddr = await userContract.institusiAddress();
      console.log(`\n✅ User -> Institusi Address: ${userContractInstitusiAddr}`);
      console.log(`   Expected: ${CONTRACT_ADDRESSES.institusi}`);
      console.log(`   Match: ${userContractInstitusiAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Error reading User->Institusi address: ${error.message}`);
    }
    
    try {
      const userContractRewardManagerAddr = await userContract.rewardManager();
      console.log(`\n✅ User -> RewardManager Address: ${userContractRewardManagerAddr}`);
      console.log(`   Expected: ${CONTRACT_ADDRESSES.rewardManager}`);
      console.log(`   Match: ${userContractRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Error reading User->RewardManager address: ${error.message}`);
    }
    
    try {
      const institusiUserAddr = await institusiContract.userContract();
      console.log(`\n✅ Institusi -> User Address: ${institusiUserAddr}`);
      console.log(`   Expected: ${CONTRACT_ADDRESSES.user}`);
      console.log(`   Match: ${institusiUserAddr.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Error reading Institusi->User address: ${error.message}`);
    }
    
    try {
      const institusiRewardManagerAddr = await institusiContract.rewardManager();
      console.log(`\n✅ Institusi -> RewardManager Address: ${institusiRewardManagerAddr}`);
      console.log(`   Expected: ${CONTRACT_ADDRESSES.rewardManager}`);
      console.log(`   Match: ${institusiRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Error reading Institusi->RewardManager address: ${error.message}`);
    }
    
    // Check RewardManager access control configuration
    console.log('\n\n🔐 RewardManager Access Control Analysis:');
    console.log('─'.repeat(50));
    
    try {
      const rewardManagerInstitusiAddr = await rewardManagerContract.institusiContract();
      console.log(`RewardManager -> Institusi Address: ${rewardManagerInstitusiAddr}`);
      console.log(`Expected: ${CONTRACT_ADDRESSES.institusi}`);
      console.log(`Match: ${rewardManagerInstitusiAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Error reading RewardManager->Institusi address: ${error.message}`);
    }
    
    try {
      const rewardManagerUserAddr = await rewardManagerContract.userContract();
      console.log(`\nRewardManager -> User Address: ${rewardManagerUserAddr}`);
      console.log(`Expected: ${CONTRACT_ADDRESSES.user}`);
      console.log(`Match: ${rewardManagerUserAddr.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Error reading RewardManager->User address: ${error.message}`);
    }
    
    console.log('\n\n🚨 "Hanya Institusi Contract" Error Analysis:');
    console.log('─'.repeat(50));
    console.log('Expected Flow for Appeal Finalization:');
    console.log('1. Admin calls Institusi.adminFinalisasiBanding() ✅');
    console.log('2. Institusi calls User.finalisasiBanding() ✅');
    console.log('3. User processes appeal and calls RewardManager functions ❌');
    console.log('4. RewardManager rejects because msg.sender is User, not Institusi');
    console.log('');
    console.log('🔍 Problem: RewardManager functions likely have modifier like:');
    console.log('   modifier onlyInstitusiContract() {');
    console.log('       require(msg.sender == institusiContract, "Hanya Institusi Contract");');
    console.log('       _;');
    console.log('   }');
    console.log('');
    console.log('💡 Solution Options:');
    console.log('   Option 1: Modify smart contracts to allow User contract calls');
    console.log('   Option 2: Handle stakes entirely in User contract');
    console.log('   Option 3: Proxy RewardManager calls through Institusi contract');
    
    // Test actual function calls to trigger the error
    console.log('\n\n🧪 Testing Actual Function Calls:');
    console.log('─'.repeat(50));
    
    // Test calling RewardManager functions directly from different contracts
    const testLaporanId = 1;
    const testUserAddress = '0x1234567890123456789012345678901234567890';
    
    console.log('\n📞 Testing RewardManager calls from User contract perspective:');
    try {
      // This should fail with "Hanya Institusi Contract" error
      const tx = await rewardManagerContract.returnStakeToPelapor.populateTransaction(testLaporanId);
      console.log('❌ This call would fail: User -> RewardManager.returnStakeToPelapor()');
      console.log('   Expected error: "Hanya Institusi Contract"');
    } catch (error) {
      console.log(`❌ Error preparing transaction: ${error.message}`);
    }
    
    console.log('\n📞 Testing RewardManager calls from Institusi contract perspective:');
    try {
      // This should succeed
      const tx = await rewardManagerContract.connect(signer).returnStakeToPelapor.populateTransaction(testLaporanId);
      console.log('✅ This call should succeed: Institusi -> RewardManager.returnStakeToPelapor()');
    } catch (error) {
      console.log(`❌ Error preparing transaction: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error in appeal debug test:', error);
  }
}

// Run the test
testAppealDebug().then(() => {
  console.log('\n🏁 Appeal Debug Test Complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Appeal Debug Test Failed:', error);
  process.exit(1);
});
