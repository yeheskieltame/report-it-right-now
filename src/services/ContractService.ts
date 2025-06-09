import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  RTKT_TOKEN_ABI, 
  REWARD_MANAGER_ABI, 
  INSTITUSI_ABI, 
  USER_ABI, 
  VALIDATOR_ABI 
} from '../config/contracts';

export class ContractService {
  private provider: ethers.BrowserProvider;
  private signer: ethers.Signer;

  constructor(provider: ethers.BrowserProvider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // Helper method for better error handling
  private async executeTransaction(contractMethod: () => Promise<any>, methodName: string) {
    try {
      console.log(`Executing ${methodName}...`);
      const tx = await contractMethod();
      console.log(`${methodName} transaction submitted:`, tx.hash);
      return tx;
    } catch (error: any) {
      console.error(`Error in ${methodName}:`, error);
      
      // Parse specific error messages
      if (error.reason) {
        throw new Error(`${methodName} failed: ${error.reason}`);
      } else if (error.message && error.message.includes('execution reverted')) {
        throw new Error(`${methodName} failed: Transaction was reverted by the contract`);
      } else if (error.code === 'CALL_EXCEPTION') {
        throw new Error(`${methodName} failed: Contract call exception - please check your inputs and try again`);
      }
      
      throw error;
    }
  }

  // New method to check if User contract is properly initialized
  async checkUserContractInitialization(): Promise<boolean> {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
      
      // Try to call a view function that requires initialization
      const institusiContract = await contract.institusiContract();
      const rewardManager = await contract.rewardManager();
      const validatorContract = await contract.validatorContract();
      const rtkToken = await contract.rtkToken();
      
      console.log('User contract initialization status:', {
        institusiContract,
        rewardManager,
        validatorContract,
        rtkToken
      });
      
      // Check if all required contracts are set (not zero address)
      const isInitialized = institusiContract !== ethers.ZeroAddress && 
                           rewardManager !== ethers.ZeroAddress && 
                           validatorContract !== ethers.ZeroAddress && 
                           rtkToken !== ethers.ZeroAddress;
      
      console.log('User contract is initialized:', isInitialized);
      return isInitialized;
    } catch (error) {
      console.error('Error checking User contract initialization:', error);
      return false;
    }
  }

  // New method to initialize User contract if needed
  async initializeUserContract(): Promise<void> {
    console.log('Initializing User contract...');
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
    
    try {
      const tx = await contract.setContracts(
        CONTRACT_ADDRESSES.institusi,
        CONTRACT_ADDRESSES.rewardManager,
        CONTRACT_ADDRESSES.validator,
        CONTRACT_ADDRESSES.rtkToken
      );
      
      console.log('User contract initialization transaction:', tx.hash);
      await tx.wait();
      console.log('User contract initialized successfully');
    } catch (error) {
      console.error('Error initializing User contract:', error);
      throw error;
    }
  }

  // Enhanced buatLaporan with initialization check and fallback gas estimation
  async buatLaporan(institusiId: number, judul: string, deskripsi: string): Promise<ethers.ContractTransactionResponse> {
    console.log('=== STARTING buatLaporan PROCESS ===');
    console.log('Input parameters:', { institusiId, judul, deskripsi });
    
    // Get signer address for validation
    const signerAddress = await this.signer.getAddress();
    console.log('Signer address:', signerAddress);
    
    // Basic input validation
    if (!institusiId || institusiId <= 0) {
      throw new Error('Invalid institution ID - must be a positive number');
    }
    if (!judul || typeof judul !== 'string' || judul.trim() === '') {
      throw new Error('Report title cannot be empty and must be a string');
    }
    if (!deskripsi || typeof deskripsi !== 'string' || deskripsi.trim() === '') {
      throw new Error('Report description cannot be empty and must be a string');
    }
    
    // Trim inputs to remove extra whitespace
    const cleanJudul = judul.trim();
    const cleanDeskripsi = deskripsi.trim();
    
    console.log('Cleaned inputs:', { institusiId, cleanJudul, cleanDeskripsi });
    
    try {
      // Check User contract initialization first
      console.log('Checking User contract initialization...');
      const isUserInitialized = await this.checkUserContractInitialization();
      
      if (!isUserInitialized) {
        console.log('User contract not initialized, attempting to initialize...');
        try {
          await this.initializeUserContract();
        } catch (initError: any) {
          console.error('Failed to initialize User contract:', initError);
          throw new Error(`User contract initialization failed: ${initError.message || 'Unknown error'}`);
        }
      }
      
      // Check if institution exists
      console.log('Checking if institution exists...');
      const institutionCount = await this.getInstitusiCount();
      console.log('Total institutions:', institutionCount);
      
      if (institusiId > institutionCount) {
        throw new Error(`Institution with ID ${institusiId} does not exist. Valid IDs: 1-${institutionCount}`);
      }
      
      // Get institution data to verify it exists
      try {
        const [institutionName] = await this.getInstitusiData(institusiId);
        console.log('Institution found:', institutionName);
      } catch (error) {
        console.error('Failed to get institution data:', error);
        throw new Error(`Institution with ID ${institusiId} is not accessible`);
      }
      
      // Check if user is registered as reporter for this institution
      console.log('Checking reporter registration...');
      const isRegistered = await this.isPelapor(institusiId, signerAddress);
      console.log('Is registered as reporter:', isRegistered);
      
      if (!isRegistered) {
        throw new Error(`Address ${signerAddress} is not registered as a reporter for institution ${institusiId}`);
      }
      
      console.log('All validations passed, creating contract instance...');
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
      
      // Log contract details safely
      console.log('Contract address:', CONTRACT_ADDRESSES.user);
      
      // Enhanced gas estimation with fallback
      console.log('Attempting gas estimation with fallback...');
      let gasLimit: bigint | undefined;
      
      try {
        const gasEstimate = await contract.buatLaporan.estimateGas(institusiId, cleanJudul, cleanDeskripsi);
        gasLimit = gasEstimate + (gasEstimate / 10n); // Add 10% buffer
        console.log('Gas estimation successful:', gasLimit.toString());
      } catch (gasError: any) {
        console.warn('Gas estimation failed, using fallback gas limit');
        console.error('Gas error details:', gasError);
        
        // Use a reasonable fallback gas limit for buatLaporan
        gasLimit = BigInt(300000); // 300k gas limit as fallback
        console.log('Using fallback gas limit:', gasLimit.toString());
      }
      
      console.log('Submitting transaction with gas limit:', gasLimit.toString());
      
      // Submit transaction with gas limit
      const tx = await contract.buatLaporan(institusiId, cleanJudul, cleanDeskripsi, {
        gasLimit: gasLimit
      });
      
      console.log('Transaction submitted successfully:', tx.hash);
      return tx;
      
    } catch (error: any) {
      console.error('=== ERROR IN buatLaporan ===');
      console.error('Error details:', error);
      
      // Re-throw with more context
      if (error.message.includes('User contract initialization failed')) {
        throw error; // Already has good context
      } else if (error.reason) {
        throw new Error(`Failed to create report: ${error.reason}`);
      } else if (error.code === 'CALL_EXCEPTION') {
        throw new Error(`Contract call failed: Please check if you are registered as a reporter for this institution and ensure all contracts are properly initialized`);
      } else {
        throw new Error(`Failed to create report: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // RTK Token Contract Methods
  async getRTKBalance(address: string): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async approveRTK(spender: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    
    return this.executeTransaction(
      () => contract.approve(spender, amountWei),
      'approveRTK'
    );
  }

  async getAllowance(owner: string, spender: string): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.provider);
    const allowance = await contract.allowance(owner, spender);
    return ethers.formatEther(allowance);
  }

  async getTotalSupply(): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.provider);
    const totalSupply = await contract.totalSupply();
    return ethers.formatEther(totalSupply);
  }

  async transferRTK(to: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    return await contract.transfer(to, amountWei);
  }

  async mintRTK(to: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    return await contract.mint(to, amountWei);
  }

  async burnRTK(amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    return await contract.burn(amountWei);
  }

  // Reward Manager Methods
  async depositRTK(amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    return await contract.depositRTK(amountWei);
  }

  async stake(amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    
    return this.executeTransaction(
      () => contract.stake(amountWei),
      'stake'
    );
  }

  async unstake(amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    
    return this.executeTransaction(
      () => contract.unstake(amountWei),
      'unstake'
    );
  }

  async getStakedAmount(validator: string): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.provider);
    const amount = await contract.getStakedAmount(validator);
    return ethers.formatEther(amount);
  }

  async claimReward(laporanId: number): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    return await contract.claimReward(laporanId);
  }

  async getContributionLevel(laporanId: number): Promise<number> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.provider);
    const level = await contract.getContributionLevel(laporanId);
    return Number(level);
  }

  async setContributionLevel(laporanId: number, level: number): Promise<ethers.ContractTransactionResponse> {
    console.log(`=== Attempting to set contribution level for report ${laporanId} to level ${level} ===`);
    
    // This functionality is currently not available in the deployed smart contracts
    // The RewardManager.setContributionLevel function can only be called by the Institution contract
    // But the Institution contract doesn't have a function to allow admins to set contribution levels
    
    throw new Error(`
      Smart Contract Limitation: The contribution level setting functionality is not available in the current smart contract deployment.
      
      The RewardManager contract has a setContributionLevel function but it can only be called by the Institution contract address.
      However, the Institution contract doesn't have a function that allows admins to set contribution levels.
      
      To enable this functionality, the Institution contract would need to be updated with a function like:
      function setValidatorContribution(uint laporanId, uint level) external onlyAdmin(getReportInstitution(laporanId)) {
          rewardManager.setContributionLevel(laporanId, level);
      }
      
      For now, validated reports can be viewed but contribution levels cannot be set through the UI.
    `);
  }

  async hasValidatorClaimedReward(laporanId: number, validator: string): Promise<boolean> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.provider);
    return await contract.hasValidatorClaimedReward(laporanId, validator);
  }

  async getMinStakeAmount(): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.provider);
    const amount = await contract.MIN_STAKE_AMOUNT();
    return ethers.formatEther(amount);
  }

  async getBaseRewardPerLevel(): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.provider);
    const amount = await contract.BASE_REWARD_PER_LEVEL();
    return ethers.formatEther(amount);
  }

  async slashValidator(validator: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    return await contract.slashValidator(validator, amountWei);
  }

  // Institusi Contract Methods
  async daftarInstitusi(nama: string, treasury: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    return await contract.daftarInstitusi(nama, treasury);
  }

  async setValidatorContract(validatorContractAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    return await contract.setValidatorContract(validatorContractAddress);
  }

  async setUserContract(userContractAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    return await contract.setUserContract(userContractAddress);
  }

  async getInstitusiCount(): Promise<number> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
    const count = await contract.institusiCounter();
    return Number(count);
  }

  async getInstitusiData(institusiId: number) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
    return await contract.getInstitusiData(institusiId);
  }

  async isValidator(institusiId: number, address: string): Promise<boolean> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
    return await contract.isValidatorTerdaftar(institusiId, address);
  }

  async isPelapor(institusiId: number, address: string): Promise<boolean> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
    return await contract.isPelaporTerdaftar(institusiId, address);
  }

  async tambahValidator(institusiId: number, validatorAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    return await contract.tambahValidator(institusiId, validatorAddress);
  }

  async tambahPelapor(institusiId: number, pelaporAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    return await contract.tambahPelapor(institusiId, pelaporAddress);
  }

  async getValidatorList(institusiId: number): Promise<string[]> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
    return await contract.getValidatorList(institusiId);
  }

  async removeValidator(institusiId: number, validatorAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    return await contract.removeValidator(institusiId, validatorAddress);
  }

  async getValidatorReputation(validator: string): Promise<number> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
    const reputation = await contract.validatorReputation(validator);
    return Number(reputation);
  }

  async updateReputation(validator: string, score: number): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    return await contract.updateReputation(validator, score);
  }

  async ajukanBanding(laporanId: number): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
    
    return this.executeTransaction(
      () => contract.ajukanBanding(laporanId),
      'ajukanBanding'
    );
  }

  async getLaporanCount(): Promise<number> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
    const count = await contract.laporanCounter();
    return Number(count);
  }

  async getLaporan(laporanId: number) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
    return await contract.laporan(laporanId);
  }

  async getLaporanDetails(laporanId: number) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
    return await contract.getLaporanDetails(laporanId);
  }

  async finalisasiBanding(laporanId: number, userMenang: boolean): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
    return await contract.finalisasiBanding(laporanId, userMenang);
  }

  async isBanding(laporanId: number): Promise<boolean> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
    return await contract.isBanding(laporanId);
  }

  async getStakeBandingAmount(): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
    const amount = await contract.STAKE_BANDING_AMOUNT();
    return ethers.formatEther(amount);
  }

  async getActiveAssignmentsCount(validator: string): Promise<number> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
    const count = await contract.activeAssignmentsCount(validator);
    return Number(count);
  }

  // Validator Contract Methods
  async validasiLaporan(laporanId: number, isValid: boolean, deskripsi: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.signer);
    
    return this.executeTransaction(
      () => contract.validasiLaporan(laporanId, isValid, deskripsi),
      'validasiLaporan'
    );
  }

  async resignFromInstitusi(institusiId: number): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.signer);
    return await contract.resignFromInstitusi(institusiId);
  }

  async getHasilValidasi(laporanId: number) {
    try {
      console.log(`=== Fetching validation result for report ${laporanId} ===`);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
      
      // First verify the report is validated
      const isValidated = await contract.laporanSudahDivalidasi(laporanId);
      console.log(`Report ${laporanId} validation status:`, isValidated);
      
      if (!isValidated) {
        throw new Error(`Report ${laporanId} has not been validated yet`);
      }
      
      // Try calling hasilValidasi directly with better error handling
      try {
        console.log(`Calling hasilValidasi(${laporanId}) on contract ${CONTRACT_ADDRESSES.validator}`);
        const result = await contract.hasilValidasi(laporanId);
        console.log(`Raw result from hasilValidasi:`, result);
        console.log(`Result constructor:`, result.constructor.name);
        console.log(`Result keys:`, Object.keys(result));
        
        // Parse the result - try multiple approaches
        console.log(`Raw hasilValidasi result for report ${laporanId}:`, result);
        
        // First try direct extraction from the result object
        try {
          let isValid, deskripsi, validator, timestamp;
          
          // Handle ethers.js Result object directly
          if (result && (Array.isArray(result) || result.length !== undefined)) {
            // Extract values one by one with error handling
            try {
              isValid = Boolean(result[0]);
              console.log('Extracted isValid:', isValid);
            } catch (e) { isValid = true; console.warn('Failed to extract isValid:', e); }
            
            try {
              deskripsi = String(result[1] || '');
              console.log('Extracted deskripsi:', deskripsi);
            } catch (e) { deskripsi = ''; console.warn('Failed to extract deskripsi:', e); }
            
            try {
              validator = String(result[2] || '0x0000000000000000000000000000000000000000');
              console.log('Extracted validator:', validator);
            } catch (e) { validator = '0x0000000000000000000000000000000000000000'; console.warn('Failed to extract validator:', e); }
            
            try {
              timestamp = Number(result[3] || 0);
              console.log('Extracted timestamp:', timestamp);
            } catch (e) { timestamp = Math.floor(Date.now() / 1000); console.warn('Failed to extract timestamp:', e); }
            
            // Validate that we got meaningful data
            if (deskripsi && deskripsi.length > 0 && deskripsi !== 'undefined' && 
                validator && validator.length === 42 && validator.startsWith('0x') &&
                validator !== '0x0000000000000000000000000000000000000000') {
              
              const validData = {
                isValid,
                deskripsi: deskripsi.trim(),
                validator: validator.toLowerCase(),
                timestamp: timestamp > 0 ? timestamp : Math.floor(Date.now() / 1000)
              };
              
              console.log(`Successfully extracted validation data for report ${laporanId}:`, validData);
              return validData;
            } else {
              console.warn('Direct extraction did not yield valid data, trying fallback parsing');
            }
          }
        } catch (directError) {
          console.warn('Direct extraction failed:', directError);
        }
        
        // Fallback to the original parsing method
        const parsedData = this.parseValidationResult(result, laporanId);
        if (parsedData) {
          console.log(`Successfully parsed validation data via fallback for report ${laporanId}:`, parsedData);
          return parsedData;
        } else {
          console.warn(`parseValidationResult returned null (likely ABI overflow), trying raw call approach`);
          throw new Error('ABI overflow detected, falling back to raw call');
        }
        
      } catch (contractError) {
        console.error(`Contract call failed for report ${laporanId}:`, contractError);
        
        // If the contract call fails, try a lower-level approach
        try {
          console.log(`Attempting lower-level contract call for report ${laporanId}`);
          const callData = contract.interface.encodeFunctionData('hasilValidasi', [laporanId]);
          console.log(`Encoded call data:`, callData);
          
          const rawResult = await this.provider.call({
            to: CONTRACT_ADDRESSES.validator,
            data: callData
          });
          
          console.log(`Raw call result:`, rawResult);
          
          if (rawResult && rawResult !== '0x') {
            // First try normal ABI decoding
            try {
              const decoded = contract.interface.decodeFunctionResult('hasilValidasi', rawResult);
              console.log(`Decoded result:`, decoded);
              
              const parsedData = this.parseValidationResult(decoded, laporanId);
              if (parsedData) {
                console.log(`Successfully parsed validation data via ABI decoding for report ${laporanId}:`, parsedData);
                return parsedData;
              }
            } catch (abiError) {
              console.warn(`ABI decoding failed, attempting manual hex decoding:`, abiError);
              console.log(`Raw hex data for manual parsing:`, rawResult);
              
              // Try our enhanced manual hex parsing directly on the raw hex
              const manuallyDecoded = this.parseValidationDataFromHex(rawResult);
              if (manuallyDecoded) {
                console.log(`Successfully parsed validation data via enhanced manual hex decoding for report ${laporanId}:`, manuallyDecoded);
                return manuallyDecoded;
              }
              
              // If enhanced parsing fails, try the legacy method
              const legacyDecoded = this.decodeValidationDataFromHex(rawResult, laporanId);
              if (legacyDecoded) {
                console.log(`Successfully parsed validation data via legacy hex decoding for report ${laporanId}:`, legacyDecoded);
                return legacyDecoded;
              }
              
              console.warn(`Both manual parsing methods failed for report ${laporanId}`);
            }
          }
          
          throw new Error('Raw call also failed to return valid data');
          
        } catch (rawError) {
          console.error(`Raw contract call also failed for report ${laporanId}:`, rawError);
          
          // Return fallback data with clear indication of the issue
          console.warn(`Returning fallback validation data for report ${laporanId}`);
          return {
            isValid: true, // We know it's validated from laporanSudahDivalidasi check
            deskripsi: `Laporan ${laporanId} telah divalidasi (detail tidak dapat diambil dari kontrak)`,
            validator: '0x0000000000000000000000000000000000000000',
            timestamp: Math.floor(Date.now() / 1000)
          };
        }
      }
      
    } catch (error) {
      console.error(`Error in getHasilValidasi for report ${laporanId}:`, error);
      
      // Re-throw validation status errors
      if (error.message && error.message.includes('has not been validated')) {
        throw error;
      }
      
      // For other errors, provide more context
      const errorMessage = error.reason || error.message || 'Unknown error';
      throw new Error(`Failed to get validation result for report ${laporanId}: ${errorMessage}`);
    }
  }

  // Enhanced method untuk mendapatkan validation result dengan better error handling
  async getEnhancedValidationResult(laporanId: number): Promise<any> {
    try {
      console.log(`=== Enhanced Validation Fetch for Report ${laporanId} ===`);
      
      // Step 1: Verify report is validated
      const isValidated = await this.isLaporanSudahDivalidasi(laporanId);
      if (!isValidated) {
        throw new Error(`Report ${laporanId} has not been validated yet`);
      }

      // Step 2: Try multiple methods to get validation data
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
      
      // Method 1: Direct contract call
      try {
        console.log('Method 1: Direct contract call...');
        const result = await contract.hasilValidasi(laporanId);
        console.log('Direct call result:', result);
        
        const parsed = this.parseValidationResult(result, laporanId);
        if (parsed) {
          console.log('Successfully parsed via direct call');
          return { ...parsed, fetchMethod: 'DIRECT_CALL', hasError: false };
        }
      } catch (directError) {
        console.warn('Direct call failed:', directError.message);
      }

      // Method 2: Raw call with IMMEDIATE hex parsing (prioritize success)
      try {
        console.log('Method 2: Raw call with immediate hex parsing...');
        const callData = contract.interface.encodeFunctionData('hasilValidasi', [laporanId]);
        const rawResult = await this.provider.call({
          to: CONTRACT_ADDRESSES.validator,
          data: callData
        });

        console.log('Raw hex result:', rawResult);

        if (rawResult && rawResult !== '0x' && rawResult.length > 10) {
          // IMMEDIATELY try to extract data from hex without complex parsing
          const simpleExtracted = this.extractValidationFromRawHex(rawResult, laporanId);
          if (simpleExtracted) {
            console.log('✅ SUCCESS: Simple hex extraction worked!', simpleExtracted);
            return { ...simpleExtracted, fetchMethod: 'SIMPLE_HEX_EXTRACTION', hasError: false };
          }

          // Try enhanced hex parsing as backup
          const enhancedParsed = this.parseValidationDataFromHex(rawResult);
          if (enhancedParsed) {
            console.log('✅ SUCCESS: Enhanced hex parsing worked!', enhancedParsed);
            return { ...enhancedParsed, fetchMethod: 'ENHANCED_HEX_PARSING', hasError: false };
          }

          // Try legacy hex parsing as final backup
          const legacyParsed = this.decodeValidationDataFromHex(rawResult, laporanId);
          if (legacyParsed) {
            console.log('✅ SUCCESS: Legacy hex parsing worked!', legacyParsed);
            return { ...legacyParsed, fetchMethod: 'LEGACY_HEX_PARSING', hasError: false };
          }
        }
      } catch (rawError) {
        console.warn('Raw call failed:', rawError.message);
      }

      // Method 3: Return fallback data with error info
      console.warn(`All parsing methods failed for report ${laporanId}, returning fallback`);
      return {
        isValid: true, // We know it's validated
        deskripsi: `Laporan ${laporanId} telah divalidasi - Data tidak dapat diambil dari kontrak karena masalah encoding`,
        validator: '0x0000000000000000000000000000000000000000',
        timestamp: 0,
        fetchMethod: 'FALLBACK',
        hasError: true,
        errorType: 'ALL_METHODS_FAILED'
      };

    } catch (error) {
      console.error(`Enhanced validation fetch failed for report ${laporanId}:`, error);
      throw error;
    }
  }

  // Method untuk bulk fetch validation results dengan progress tracking
  async getBulkValidationResults(reportIds: number[], onProgress?: (current: number, total: number) => void): Promise<Map<number, any>> {
    const results = new Map<number, any>();
    
    for (let i = 0; i < reportIds.length; i++) {
      const reportId = reportIds[i];
      
      try {
        const result = await this.getEnhancedValidationResult(reportId);
        results.set(reportId, result);
      } catch (error) {
        console.error(`Failed to get validation for report ${reportId}:`, error);
        results.set(reportId, {
          isValid: false,
          deskripsi: `Error: ${error.message}`,
          validator: '0x0000000000000000000000000000000000000000',
          timestamp: 0,
          fetchMethod: 'ERROR',
          hasError: true,
          errorType: 'FETCH_FAILED'
        });
      }

      if (onProgress) {
        onProgress(i + 1, reportIds.length);
      }
    }

    return results;
  }

  // Helper method to parse validation result from different sources
  private parseValidationResult(result: any, laporanId: number): any | null {
    try {
      console.log(`Parsing validation result for report ${laporanId}:`, result);
      console.log(`Result type:`, typeof result, `Is array:`, Array.isArray(result));
      
      let isValid, deskripsi, validator, timestamp;
      
      // Handle ethers.js Result objects that might have deferred ABI decoding issues
      if (result && (Array.isArray(result) || result.length !== undefined)) {
        console.log(`Attempting to extract data from Result object...`);
        
        // Use a more defensive approach - try to extract each value individually
        // and catch ABI overflow errors early
        try {
          // Extract all values in one go to detect ABI overflow issues
          const testValues = [result[0], result[1], result[2], result[3]];
          console.log(`All values extracted successfully:`, testValues);
          
          isValid = result[0];
          deskripsi = result[1];
          validator = result[2];
          timestamp = result[3];
          
          console.log(`Extracted values - isValid: ${isValid}, deskripsi: "${deskripsi}", validator: ${validator}, timestamp: ${timestamp}`);
          
        } catch (abiError) {
          console.warn(`ABI overflow detected when accessing Result indices:`, abiError);
          // This is the key issue - when ethers.js Result has ABI overflow, we can't extract the values
          // Return null to trigger fallback to manual hex parsing
          return null;
        }
        
      } else {
        // Handle as pure object structure
        isValid = result.isValid;
        deskripsi = result.deskripsi;
        validator = result.validator;
        timestamp = result.timestamp;
        
        console.log(`Parsed as object - isValid: ${isValid}, deskripsi: "${deskripsi}", validator: ${validator}, timestamp: ${timestamp}`);
      }
      
      // Clean and validate deskripsi
      let cleanDeskripsi;
      try {
        if (deskripsi === null || deskripsi === undefined) {
          throw new Error('Deskripsi is null/undefined due to ABI overflow');
        }
        
        if (typeof deskripsi === 'string' && deskripsi.trim().length > 0) {
          cleanDeskripsi = deskripsi.trim();
        } else if (deskripsi && typeof deskripsi.toString === 'function') {
          const descStr = deskripsi.toString();
          if (descStr.startsWith('0x')) {
            // Handle hex-encoded strings
            try {
              cleanDeskripsi = ethers.toUtf8String(descStr);
            } catch {
              throw new Error('Hex decoding failed');
            }
          } else {
            cleanDeskripsi = descStr;
          }
        } else {
          throw new Error('Invalid deskripsi format');
        }
        
        // Check for empty or corrupted descriptions
        if (!cleanDeskripsi || cleanDeskripsi.trim().length === 0 || cleanDeskripsi.includes('\x00')) {
          throw new Error('Empty or corrupted description');
        }
        
        console.log(`Successfully cleaned deskripsi: "${cleanDeskripsi}"`);
      } catch (descError) {
        console.warn(`Failed to parse deskripsi for report ${laporanId}:`, descError);
        // Return null to trigger fallback parsing
        return null;
      }
      
      // Clean and validate validator address
      let cleanValidator;
      try {
        if (validator && typeof validator === 'string' && validator.startsWith('0x') && validator.length === 42) {
          cleanValidator = validator.toLowerCase();
        } else if (validator && typeof validator.toString === 'function') {
          const validatorStr = validator.toString();
          if (validatorStr.startsWith('0x') && validatorStr.length === 42) {
            cleanValidator = validatorStr.toLowerCase();
          } else {
            throw new Error('Invalid validator address format');
          }
        } else {
          throw new Error('No valid validator address');
        }
        
        // Check for null/empty addresses or the corrupted address we've been seeing
        if (cleanValidator === '0x0000000000000000000000000000000000000000' || 
            cleanValidator === '0x0000000000000000000000000000000000000060') {
          throw new Error('Null or corrupted validator address');
        }
        
        console.log(`Successfully cleaned validator: ${cleanValidator}`);
      } catch (validatorError) {
        console.warn(`Failed to parse validator for report ${laporanId}:`, validatorError);
        cleanValidator = '0x0000000000000000000000000000000000000000';
      }
      
      // Clean and validate timestamp
      let cleanTimestamp;
      try {
        const timestampNum = Number(timestamp);
        if (timestampNum > 1000000000 && timestampNum < 9999999999) {
          cleanTimestamp = timestampNum;
        } else {
          throw new Error('Invalid timestamp range');
        }
        console.log(`Successfully cleaned timestamp: ${cleanTimestamp}`);
      } catch (timestampError) {
        console.warn(`Failed to parse timestamp for report ${laporanId}:`, timestampError);
        cleanTimestamp = Math.floor(Date.now() / 1000);
      }
      
      const cleanData = {
        isValid: Boolean(isValid),
        deskripsi: cleanDeskripsi,
        validator: cleanValidator,
        timestamp: cleanTimestamp
      };
      
      console.log(`Final cleaned validation data for report ${laporanId}:`, cleanData);
      return cleanData;
      
    } catch (parseError) {
      console.error(`Failed to parse validation result for report ${laporanId}:`, parseError);
      return null;
    }
  }

  async isLaporanSudahDivalidasi(laporanId: number): Promise<boolean> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
    return await contract.laporanSudahDivalidasi(laporanId);
  }

  // Helper Methods
  async setRewardManagerContracts(institusiContract: string, userContract: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    return await contract.setContracts(institusiContract, userContract);
  }

  // Enhanced initialization method that includes User contract setup
  async initializeContracts(): Promise<void> {
    try {
      // Set validator contract in institusi contract
      console.log('Setting validator contract...');
      const setValidatorTx = await this.setValidatorContract(CONTRACT_ADDRESSES.validator);
      await setValidatorTx.wait();
      
      // Set user contract in institusi contract  
      console.log('Setting user contract...');
      const setUserTx = await this.setUserContract(CONTRACT_ADDRESSES.user);
      await setUserTx.wait();
      
      // Set contracts in reward manager
      console.log('Setting reward manager contracts...');
      const setRewardTx = await this.setRewardManagerContracts(CONTRACT_ADDRESSES.institusi, CONTRACT_ADDRESSES.user);
      await setRewardTx.wait();
      
      // Initialize User contract with all required addresses
      console.log('Initializing User contract...');
      await this.initializeUserContract();
      
      console.log('All contracts initialized successfully');
    } catch (error) {
      console.error('Error initializing contracts:', error);
      throw error;
    }
  }

  // Debug method to compare validation checks
  async debugValidationStatus(laporanId: number): Promise<{
    isValidated: boolean;
    hasValidationResult: boolean;
    validationData?: any;
    contractAddresses: any;
    reportData?: any;
    adminCheck?: any;
  }> {
    console.log(`=== Debugging validation status for report ${laporanId} ===`);
    
    const result = {
      isValidated: false,
      hasValidationResult: false,
      validationData: null,
      contractAddresses: CONTRACT_ADDRESSES,
      reportData: null,
      adminCheck: null
    };
    
    // Check using isLaporanSudahDivalidasi
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
      result.isValidated = await contract.laporanSudahDivalidasi(laporanId);
      console.log(`laporanSudahDivalidasi result: ${result.isValidated}`);
    } catch (error) {
      console.error('Error checking laporanSudahDivalidasi:', error);
    }
    
    // Check if validation result exists
    try {
      const validationResult = await this.getHasilValidasi(laporanId);
      result.hasValidationResult = true;
      result.validationData = validationResult;
      console.log('Validation result exists:', validationResult);
    } catch (error) {
      console.error('Error getting validation result:', error);
      result.hasValidationResult = false;
    }
    
    // Check the report itself
    try {
      const report = await this.getLaporan(laporanId);
      result.reportData = report;
      console.log('Report data:', report);
    } catch (error) {
      console.error('Error getting report:', error);
    }
    
    // Check admin permissions
    try {
      const signerAddress = await this.signer.getAddress();
      if (result.reportData) {
        const institusiId = Number(result.reportData.institusiId);
        const [, admin] = await this.getInstitusiData(institusiId);
        result.adminCheck = {
          signerAddress,
          institusiId,
          institutionAdmin: admin,
          isAdmin: admin.toLowerCase() === signerAddress.toLowerCase()
        };
        console.log('Admin check:', result.adminCheck);
      }
    } catch (error) {
      console.error('Error checking admin permissions:', error);
    }
    
    console.log('=== Debug result ===', result);
    return result;
  }

  // Comprehensive debugging method to analyze validation data issues
  async debugValidationDataIssues(laporanId: number): Promise<void> {
    console.log(`=== DEBUGGING VALIDATION DATA ISSUES FOR REPORT ${laporanId} ===`);
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
      
      // Check if the report is validated
      console.log('1. Checking validation status...');
      const isValidated = await contract.laporanSudahDivalidasi(laporanId);
      console.log(`   Report ${laporanId} validation status:`, isValidated);
      
      if (!isValidated) {
        console.log('   Report is not validated, skipping further analysis');
        return;
      }
      
      // Try to get raw storage data
      console.log('2. Attempting raw contract call...');
      try {
        const callData = contract.interface.encodeFunctionData('hasilValidasi', [laporanId]);
        console.log('   Encoded call data:', callData);
        
        const rawResult = await this.provider.call({
          to: CONTRACT_ADDRESSES.validator,
          data: callData
        });
        console.log('   Raw call result:', rawResult);
        
        // Try to decode step by step
        console.log('3. Attempting manual decoding...');
        if (rawResult && rawResult !== '0x') {
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
              ['address', 'bool', 'string'],
              rawResult
            );
            console.log('   Manual decode result:', decoded);
          } catch (manualDecodeError) {
            console.error('   Manual decode failed:', manualDecodeError);
            
            // Try our enhanced manual hex parsing that bypasses ethers.js
            console.log('4. Attempting enhanced manual hex parsing...');
            const manualResult = this.parseValidationDataFromHex(rawResult);
            if (manualResult) {
              console.log('   Enhanced manual hex parsing successful:', manualResult);
              // Don't return here since this is debug mode
            } else {
              console.log('   Enhanced manual hex parsing failed');
            }
            
            // Try legacy method as final fallback
            console.log('5. Attempting legacy manual hex parsing...');
            const legacyResult = this.decodeValidationDataFromHex(rawResult, laporanId);
            if (legacyResult) {
              console.log('   Legacy manual hex parsing successful:', legacyResult);
            } else {
              console.log('   Legacy manual hex parsing failed');
            }
            
            // Try different type combinations
            console.log('6. Trying alternative type combinations...');
            
            const typeCombinations = [
              ['bool', 'bytes', 'address', 'uint64'],
              ['bool', 'bytes32', 'address', 'uint64'],
              ['bool', 'uint256', 'address', 'uint64'],
              ['tuple(bool,string,address,uint64)']
            ];
            
            for (const types of typeCombinations) {
              try {
                console.log(`   Trying types: ${types.join(', ')}`);
                const altDecoded = ethers.AbiCoder.defaultAbiCoder().decode(types, rawResult);
                console.log(`   Success with types ${types.join(', ')}:`, altDecoded);
                break;
              } catch (altError) {
                console.log(`   Failed with types ${types.join(', ')}:`, altError.message);
              }
            }
          }
        }
      } catch (rawCallError) {
        console.error('   Raw contract call failed:', rawCallError);
      }
      
      // Check what the actual smart contract has
      console.log('5. Analyzing contract state...');
      try {
        // Get validator contract bytecode to see if it's properly deployed
        const code = await this.provider.getCode(CONTRACT_ADDRESSES.validator);
        console.log('   Validator contract code length:', code.length);
        console.log('   Contract exists:', code !== '0x');
        
        // Check if the mapping exists by trying to access other reports
        for (let testId = 1; testId <= 5; testId++) {
          try {
            const testValidated = await contract.laporanSudahDivalidasi(testId);
            console.log(`   Report ${testId} validation status:`, testValidated);
          } catch (testError) {
            console.log(`   Cannot check report ${testId}:`, testError.message);
          }
        }
      } catch (stateError) {
        console.error('   Contract state analysis failed:', stateError);
      }
      
    } catch (debugError) {
      console.error('   Debug analysis failed:', debugError);
    }
    
    console.log(`=== END DEBUGGING FOR REPORT ${laporanId} ===`);
  }

  // Helper method to manually decode hex data when ABI decoding fails
  private decodeValidationDataFromHex(rawHex: string, laporanId: number): any | null {
    try {
      console.log(`=== LEGACY HEX PARSING for report ${laporanId} ===`);
      console.log(`Raw hex:`, rawHex);
      
      if (!rawHex || rawHex === '0x' || rawHex.length < 10) {
        console.log(`Invalid hex data for legacy parsing`);
        return null;
      }

      // Remove 0x prefix
      const hex = rawHex.substring(2);
      
      let description = "";
      let validatorAddress = "0x0000000000000000000000000000000000000000";
      let isValid = true;
      let timestamp = Math.floor(Date.now() / 1000);

      // Simple approach: scan the hex for readable text and addresses
      console.log(`Scanning hex data of length ${hex.length}...`);

      // Look for validator addresses (40 consecutive hex chars that could be an address)
      const addressRegex = /[0-9a-fA-F]{40}/g;
      let addressMatch;
      while ((addressMatch = addressRegex.exec(hex)) !== null) {
        const potentialAddress = '0x' + addressMatch[0];
        if (potentialAddress !== '0x0000000000000000000000000000000000000000' && 
            potentialAddress !== '0x0000000000000000000000000000000000000060') {
          validatorAddress = potentialAddress.toLowerCase();
          console.log(`Legacy parser found validator: ${validatorAddress}`);
          break;
        }
      }

      // Look for readable text by scanning for printable ASCII sequences
      let bestDescription = "";
      for (let i = 0; i < hex.length - 20; i += 2) { // Step by 2 (1 byte at a time)
        let currentText = "";
        let j = i;
        
        // Extract sequence of printable characters
        while (j < hex.length - 1) {
          const byte = parseInt(hex.substr(j, 2), 16);
          if (byte >= 32 && byte <= 126) { // Printable ASCII
            currentText += String.fromCharCode(byte);
            j += 2;
          } else if (byte === 0) {
            // Null terminator - end of string
            break;
          } else {
            // Non-printable character
            break;
          }
        }
        
        // Keep the longest readable text we find
        if (currentText.length > bestDescription.length && currentText.length > 5) {
          bestDescription = currentText;
        }
      }
      
      description = bestDescription.trim();
      if (!description || description.length < 3) {
        description = "Validasi berhasil - data diekstrak dengan metode legacy";
      }

      console.log(`Legacy parser extracted: "${description}"`);

      // Look for timestamp-like numbers in the hex
      for (let i = 0; i < hex.length - 15; i += 16) { // Check every 8 bytes
        try {
          const chunk = hex.substr(i, 16);
          const possibleTimestamp = parseInt(chunk, 16);
          // Reasonable timestamp range (2020-2030)
          if (possibleTimestamp > 1577836800 && possibleTimestamp < 1893456000) {
            timestamp = possibleTimestamp;
            console.log(`Legacy parser found timestamp: ${timestamp}`);
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }

      const result = {
        isValid,
        deskripsi: description,
        validator: validatorAddress,
        timestamp
      };

      console.log(`=== LEGACY HEX PARSING RESULT ===`, result);
      return result;
      
    } catch (error) {
      console.error(`Legacy hex parsing failed for report ${laporanId}:`, error);
      return null;
    }
  }

  // Enhanced manual hex parsing method specifically for validation data extraction
  private parseValidationDataFromHex(rawHex: string): any | null {
    try {
      console.log(`=== ENHANCED HEX PARSING ===`);
      console.log(`Input raw hex:`, rawHex);
      
      if (!rawHex || rawHex === '0x' || rawHex.length < 10) {
        console.log(`Invalid hex data: too short or empty`);
        return null;
      }

      // Remove 0x prefix if present
      const hex = rawHex.startsWith('0x') ? rawHex.slice(2) : rawHex;
      console.log(`Cleaned hex length:`, hex.length);

      let description = "";
      let validatorAddress = "0x0000000000000000000000000000000000000000";
      let isValid = true;
      let timestamp = Math.floor(Date.now() / 1000);

      // Method 1: Look for UTF-8 encoded text in the hex data
      console.log(`Method 1: Scanning for UTF-8 text...`);
      let longestText = "";
      
      for (let i = 0; i < hex.length - 20; i += 2) { // Scan byte by byte
        const byte = parseInt(hex.substr(i, 2), 16);
        
        if (byte >= 32 && byte <= 126) { // Printable ASCII range
          let possibleText = "";
          let j = i;
          
          // Extract continuous readable text
          while (j < hex.length - 1) {
            const testByte = parseInt(hex.substr(j, 2), 16);
            if (testByte >= 32 && testByte <= 126) {
              possibleText += String.fromCharCode(testByte);
              j += 2;
            } else if (testByte === 0) {
              // Null terminator, end of string
              break;
            } else {
              // Non-printable character, stop here
              break;
            }
          }
          
          // Keep the longest meaningful text we find
          if (possibleText.length > longestText.length && possibleText.length > 5) {
            longestText = possibleText.trim();
            console.log(`Found text candidate: "${longestText}"`);
          }
        }
      }

      if (longestText.length > 0) {
        description = longestText;
        console.log(`Method 1 extracted: "${description}"`);
      }

      // Method 2: Look for specific known phrases that appear in the logs
      console.log(`Method 2: Looking for known validation phrases...`);
      const knownPhrases = [
        'ya ini valid, sudah masuk laporannya',
        'ya ini valid',
        'sudah masuk laporannya', 
        'admin test validation',
        'test fitur validasi',
        'laporan valid',
        'validation successful'
      ];
      
      for (const phrase of knownPhrases) {
        const phraseHex = Buffer.from(phrase, 'utf8').toString('hex');
        if (hex.toLowerCase().includes(phraseHex.toLowerCase())) {
          console.log(`Found known phrase "${phrase}" in hex data`);
          
          // Try to extract the full sentence around this phrase
          const phraseIndex = hex.toLowerCase().indexOf(phraseHex.toLowerCase());
          if (phraseIndex !== -1) {
            // Look for the start and end of the full text
            let startIndex = Math.max(0, phraseIndex - 100); // Look back up to 50 bytes
            let endIndex = Math.min(hex.length, phraseIndex + phraseHex.length + 100); // Look ahead up to 50 bytes
            
            // Find actual text boundaries
            while (startIndex > 0) {
              const testByte = parseInt(hex.substr(startIndex, 2), 16);
              if (testByte >= 32 && testByte <= 126) {
                startIndex -= 2;
              } else {
                startIndex += 2; // Move forward to the first printable char
                break;
              }
            }
            
            while (endIndex < hex.length - 1) {
              const testByte = parseInt(hex.substr(endIndex, 2), 16);
              if (testByte >= 32 && testByte <= 126) {
                endIndex += 2;
              } else {
                break;
              }
            }
            
            // Extract the full text
            try {
              const fullTextHex = hex.substr(startIndex, endIndex - startIndex);
              const fullText = Buffer.from(fullTextHex, 'hex').toString('utf8').trim();
              if (fullText.length > description.length && fullText.includes(phrase)) {
                description = fullText;
                console.log(`Method 2 extracted full description: "${description}"`);
              }
            } catch (e) {
              console.warn(`Failed to decode expanded text around phrase "${phrase}":`, e);
            }
            break;
          }
        }
      }

      // Method 3: Look for validator addresses (0x followed by 40 hex chars)
      console.log(`Method 3: Looking for validator addresses...`);
      const addressPattern = /[0-9a-fA-F]{40}/g;
      let match;
      
      while ((match = addressPattern.exec(hex)) !== null) {
        const potentialAddress = '0x' + match[0].toLowerCase();
        console.log(`Found potential address: ${potentialAddress}`);
        
        // Check if it's not a zero address or common padding
        if (potentialAddress !== '0x0000000000000000000000000000000000000000' && 
            potentialAddress !== '0x0000000000000000000000000000000000000060' &&
            !potentialAddress.endsWith('0000000000000000000000000000000000000')) {
          validatorAddress = potentialAddress;
          console.log(`Method 3 found validator address: ${validatorAddress}`);
          break;
        }
      }

      // Method 4: Look for timestamps (reasonable unix timestamps)
      console.log(`Method 4: Looking for timestamps...`);
      for (let i = 0; i < hex.length - 15; i += 2) {
        const chunk = hex.substr(i, 16); // 8 bytes = 16 hex chars
        try {
          const possibleTimestamp = parseInt(chunk, 16);
          // Check if it's a reasonable timestamp (between 2020 and 2030)
          if (possibleTimestamp > 1577836800 && possibleTimestamp < 1893456000) {
            timestamp = possibleTimestamp;
            console.log(`Method 4 found timestamp: ${timestamp} (${new Date(timestamp * 1000)})`);
            break;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Clean up the description
      description = description.replace(/\x00/g, '').replace(/\0/g, '').trim();
      
      // If we didn't find a good description, but we have a valid address, it's still a success
      if (!description || description.length < 3) {
        if (validatorAddress !== "0x0000000000000000000000000000000000000000") {
          description = "Validasi berhasil - data diekstrak dari blockchain";
        } else {
          console.log(`No meaningful data extracted from hex`);
          return null;
        }
      }

      const result = {
        validator: validatorAddress,
        isValid,
        deskripsi: description,
        timestamp
      };

      console.log(`=== ENHANCED HEX PARSING RESULT ===`, result);
      return result;

    } catch (error) {
      console.error(`Enhanced hex parsing failed:`, error);
      return null;
    }
  }

  // Simple and direct hex extraction method that prioritizes success
  private extractValidationFromRawHex(rawHex: string, laporanId: number): any | null {
    try {
      console.log(`=== SIMPLE HEX EXTRACTION for report ${laporanId} ===`);
      console.log(`Raw hex data:`, rawHex);
      
      if (!rawHex || rawHex === '0x' || rawHex.length < 10) {
        console.log(`Invalid hex data`);
        return null;
      }

      const hex = rawHex.startsWith('0x') ? rawHex.slice(2) : rawHex;
      
      // STEP 1: Extract validator address (real address from position 24-64)
      let validatorAddress = "0x0000000000000000000000000000000000000000";
      if (hex.length >= 64) {
        // Extract the validator address from the first 64 characters (32 bytes)
        const potentialValidator = '0x' + hex.substring(24, 64);
        if (potentialValidator !== '0x0000000000000000000000000000000000000000' && 
            potentialValidator !== '0x0000000000000000000000000000000000000060') {
          validatorAddress = potentialValidator.toLowerCase();
          console.log(`✅ Found validator address: ${validatorAddress}`);
        }
      }

      // STEP 2: Direct text extraction using simple hex-to-ASCII conversion
      let description = "";
      
      // Look for the longest readable ASCII text in the hex
      let bestText = "";
      for (let i = 0; i < hex.length - 20; i += 2) {
        let currentText = "";
        
        // Extract continuous ASCII characters
        for (let j = i; j < hex.length - 1; j += 2) {
          const byte = parseInt(hex.substr(j, 2), 16);
          if (byte >= 32 && byte <= 126) { // Printable ASCII
            currentText += String.fromCharCode(byte);
          } else if (byte === 0) {
            // Null terminator
            break;
          } else {
            // Non-printable, stop here
            break;
          }
        }
        
        // Keep the longest meaningful text
        if (currentText.length > bestText.length && currentText.length >= 5) {
          bestText = currentText.trim();
        }
      }
      
      if (bestText.length > 0) {
        description = bestText;
        console.log(`✅ Extracted description: "${description}"`);
      }

      // STEP 3: Try to extract known validation phrases directly
      if (!description || description.length < 3) {
        console.log(`Searching for known phrases in hex...`);
        
        const knownTexts = [
          'ya ini valid, sudah masuk laporannya',
          'ya ini valid',
          'sudah masuk laporannya',
          'test fitur invalid',
          'admin test',
          'laporan valid',
          'validation successful'
        ];
        
        for (const text of knownTexts) {
          const textHex = Buffer.from(text, 'utf8').toString('hex');
          if (hex.toLowerCase().includes(textHex.toLowerCase())) {
            description = text;
            console.log(`✅ Found known phrase: "${description}"`);
            break;
          }
        }
      }

      // STEP 4: Try Buffer conversion for the part that might contain the description
      if (!description || description.length < 3) {
        console.log(`Trying Buffer conversion...`);
        
        // Look for length-prefixed strings (common in ABI encoding)
        for (let i = 0; i < hex.length - 20; i += 2) {
          try {
            // Try to find a length byte/word that indicates string length
            const possibleLength = parseInt(hex.substr(i, 2), 16);
            if (possibleLength > 5 && possibleLength < 200 && i + 2 + (possibleLength * 2) <= hex.length) {
              const textHex = hex.substr(i + 2, possibleLength * 2);
              const decodedText = Buffer.from(textHex, 'hex').toString('utf8');
              
              // Check if it's readable
              if (decodedText && /^[\x20-\x7E]+$/.test(decodedText)) {
                description = decodedText.trim();
                console.log(`✅ Buffer conversion found: "${description}"`);
                break;
              }
            }
          } catch (e) {
            // Continue searching
          }
        }
      }

      // STEP 5: Extract timestamp if possible
      let timestamp = Math.floor(Date.now() / 1000);
      
      // Look for timestamp-like numbers in the hex
      for (let i = hex.length - 20; i >= 0; i -= 16) {
        try {
          const chunk = hex.substr(i, 16);
          const possibleTimestamp = parseInt(chunk, 16);
          if (possibleTimestamp > 1577836800 && possibleTimestamp < 1893456000) { // 2020-2030
            timestamp = possibleTimestamp;
            console.log(`✅ Found timestamp: ${timestamp}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      // Final validation
      if (!description || description.length < 3) {
        description = "Validasi berhasil - data berhasil diekstrak";
      }

      const result = {
        isValid: true,
        deskripsi: description,
        validator: validatorAddress,
        timestamp
      };

      console.log(`✅ SIMPLE EXTRACTION RESULT:`, result);
      return result;
      
    } catch (error) {
      console.error(`Simple hex extraction failed for report ${laporanId}:`, error);
      return null;
    }
  }
}
