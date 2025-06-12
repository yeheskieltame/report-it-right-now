// Quick test to verify debugAppealFinalization method exists
// Test this in browser console

console.log('=== Testing debugAppealFinalization method ===');

// This would be run in browser console after connecting wallet
const testDebugMethod = async () => {
  try {
    // Get the contract service from wallet context
    const contractService = window.contractService; // Assuming it's available globally
    
    if (!contractService) {
      console.error('ContractService not available. Please connect wallet first.');
      return;
    }
    
    if (typeof contractService.debugAppealFinalization !== 'function') {
      console.error('debugAppealFinalization method not found!');
      console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(contractService)));
      return;
    }
    
    console.log('✅ debugAppealFinalization method found!');
    
    // Test with a sample report ID (replace with actual ID)
    const sampleReportId = 1;
    console.log(`Testing debug with report ID: ${sampleReportId}`);
    
    const debugInfo = await contractService.debugAppealFinalization(sampleReportId);
    console.log('Debug info:', debugInfo);
    
  } catch (error) {
    console.error('Error testing debug method:', error);
  }
};

// Instructions for manual testing
console.log('To test:');
console.log('1. Connect your wallet');
console.log('2. Go to AdminDashboard');
console.log('3. Try to finalize an appeal');
console.log('4. Check console for debug output');

export default testDebugMethod;
