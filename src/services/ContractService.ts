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
      console.log(`Fetching validation result for report ${laporanId}`);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
      
      // First verify the report is validated
      const isValidated = await contract.laporanSudahDivalidasi(laporanId);
      if (!isValidated) {
        throw new Error(`Report ${laporanId} has not been validated yet`);
      }
      
      // Try multiple approaches to get the validation data
      let validationData = null;
      
      // Approach 1: Try calling hasilValidasi directly
      try {
        console.log(`Trying direct hasilValidasi call for report ${laporanId}`);
        const result = await contract.hasilValidasi(laporanId);
        console.log(`Raw validation result for report ${laporanId}:`, result);
        
        // Parse the result carefully
        const parsedData = this.parseValidationResult(result, laporanId);
        if (parsedData) {
          validationData = parsedData;
        }
      } catch (directError) {
        console.warn(`Direct hasilValidasi call failed for report ${laporanId}:`, directError);
      }
      
      // Approach 2: Try using raw call if direct call fails
      if (!validationData) {
        try {
          console.log(`Trying raw contract call for report ${laporanId}`);
          const rawCall = await this.provider.call({
            to: CONTRACT_ADDRESSES.validator,
            data: contract.interface.encodeFunctionData('hasilValidasi', [laporanId])
          });
          
          console.log(`Raw call result for report ${laporanId}:`, rawCall);
          
          // Try to decode the raw result
          const decoded = contract.interface.decodeFunctionResult('hasilValidasi', rawCall);
          console.log(`Decoded raw result for report ${laporanId}:`, decoded);
          
          const parsedData = this.parseValidationResult(decoded, laporanId);
          if (parsedData) {
            validationData = parsedData;
          }
        } catch (rawError) {
          console.warn(`Raw contract call failed for report ${laporanId}:`, rawError);
        }
      }
      
      // Approach 3: Return fallback data if both approaches fail
      if (!validationData) {
        console.warn(`All validation data retrieval methods failed for report ${laporanId}, using fallback`);
        validationData = {
          isValid: true, // We know it's validated from isLaporanSudahDivalidasi
          deskripsi: `Laporan ${laporanId} telah divalidasi (detail tidak tersedia karena masalah encoding)`,
          validator: '0x0000000000000000000000000000000000000000',
          timestamp: Math.floor(Date.now() / 1000) // Use current timestamp as fallback
        };
      }
      
      console.log(`Final validation result for report ${laporanId}:`, validationData);
      return validationData;
      
    } catch (error) {
      console.error(`Error fetching validation result for report ${laporanId}:`, error);
      
      // Return more specific error information
      if (error.message && error.message.includes('has not been validated')) {
        throw error; // Re-throw validation status errors
      } else if (error.reason) {
        throw new Error(`Contract error getting validation result: ${error.reason}`);
      } else {
        throw new Error(`Failed to get validation result for report ${laporanId}: ${error.message}`);
      }
    }
  }

  // Helper method to parse validation result from different sources
  private parseValidationResult(result: any, laporanId: number): any | null {
    try {
      console.log(`Parsing validation result for report ${laporanId}:`, result);
      
      // Handle different result formats
      let isValid, deskripsi, validator, timestamp;
      
      if (Array.isArray(result) || result.length !== undefined) {
        // Handle as array-like structure
        isValid = result[0];
        validator = result[2];
        timestamp = result[3];
        
        // Handle deskripsi with multiple fallbacks
        try {
          deskripsi = result[1];
          if (typeof deskripsi !== 'string') {
            throw new Error('Deskripsi is not a string');
          }
        } catch (descError) {
          console.warn(`Failed to parse deskripsi for report ${laporanId}:`, descError);
          // Try alternative parsing methods
          try {
            // Try to get as hex and convert
            const rawDesc = result[1];
            if (rawDesc && rawDesc.toString) {
              const descStr = rawDesc.toString();
              if (descStr.startsWith('0x')) {
                // Try hex decoding
                deskripsi = ethers.toUtf8String(descStr);
              } else {
                deskripsi = descStr;
              }
            } else {
              throw new Error('Cannot convert deskripsi');
            }
          } catch (altError) {
            console.warn(`Alternative deskripsi parsing failed for report ${laporanId}:`, altError);
            deskripsi = `Laporan ${laporanId} - Detail validasi tidak dapat dibaca (encoding error)`;
          }
        }
      } else {
        // Handle as object structure
        isValid = result.isValid;
        deskripsi = result.deskripsi || `Laporan ${laporanId} - Detail validasi tidak tersedia`;
        validator = result.validator;
        timestamp = result.timestamp;
      }
      
      // Validate and clean the data
      const cleanData = {
        isValid: Boolean(isValid),
        deskripsi: typeof deskripsi === 'string' ? deskripsi : `Laporan ${laporanId} - Deskripsi tidak valid`,
        validator: validator && validator !== '0x0000000000000000000000000000000000000000' && validator !== '0x0000000000000000000000000000000000000060' 
          ? String(validator) 
          : '0x0000000000000000000000000000000000000000',
        timestamp: Number(timestamp) > 1000000000 ? Number(timestamp) : Math.floor(Date.now() / 1000) // Use current time if timestamp is invalid
      };
      
      console.log(`Cleaned validation data for report ${laporanId}:`, cleanData);
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
              ['bool', 'string', 'address', 'uint64'],
              rawResult
            );
            console.log('   Manual decode result:', decoded);
          } catch (manualDecodeError) {
            console.error('   Manual decode failed:', manualDecodeError);
            
            // Try different type combinations
            console.log('4. Trying alternative type combinations...');
            
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
}
