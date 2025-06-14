import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  RTKT_TOKEN_ABI, 
  REWARD_MANAGER_ABI, 
  INSTITUSI_ABI, 
  USER_ABI, 
  VALIDATOR_ABI,
  TOKENSALE_ABI
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
      console.error('Error details:', {
        reason: error.reason,
        code: error.code,
        message: error.message,
        data: error.data,
        transaction: error.transaction
      });
      
      // Parse specific error messages
      if (error.reason) {
        throw new Error(`${methodName} failed: ${error.reason}`);
      } else if (error.message && error.message.includes('execution reverted')) {
        const revertReason = error.message.includes(':') 
          ? error.message.split(':').pop().trim()
          : 'Transaction was reverted by the contract';
        throw new Error(`${methodName} failed: ${revertReason}`);
      } else if (error.code === 'CALL_EXCEPTION') {
        throw new Error(`${methodName} failed: Contract call exception - please check your inputs and permissions`);
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error(`${methodName} failed: Cannot estimate gas - transaction may revert. Check contract state and permissions.`);
      } else if (error.message && error.message.includes('missing revert data')) {
        throw new Error(`${methodName} failed: Contract function reverted without error message. Check if you have the required permissions and contract state is valid.`);
      } else if (error.message && error.message.includes('Internal JSON-RPC error')) {
        throw new Error(`${methodName} failed: Network error occurred. Please check your connection and try again.`);
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

  // TokenSale Contract Methods
  async getTokenPrice(): Promise<string> {
    if (!CONTRACT_ADDRESSES.tokenSale) {
      throw new Error('TokenSale contract address not set');
    }
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.tokenSale, TOKENSALE_ABI, this.provider);
    const price = await contract.tokenPrice();
    return ethers.formatEther(price);
  }

  async buyTokensWithETH(ethAmount: string): Promise<ethers.ContractTransactionResponse> {
    if (!CONTRACT_ADDRESSES.tokenSale) {
      throw new Error('TokenSale contract address not set');
    }
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.tokenSale, TOKENSALE_ABI, this.signer);
    const signer = await this.signer.getAddress();
    
    return this.executeTransaction(
      () => contract.buyTokens(signer, { value: ethers.parseEther(ethAmount) }),
      'buyTokensWithETH'
    );
  }

  async getTokenSaleRTKBalance(): Promise<string> {
    if (!CONTRACT_ADDRESSES.tokenSale) {
      throw new Error('TokenSale contract address not set');
    }
    const rtkContract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.provider);
    const balance = await rtkContract.balanceOf(CONTRACT_ADDRESSES.tokenSale);
    return ethers.formatEther(balance);
  }

  async calculateTokensForETH(ethAmount: string): Promise<string> {
    if (!CONTRACT_ADDRESSES.tokenSale) {
      throw new Error('TokenSale contract address not set');
    }
    const tokenPriceWei = await this.getTokenPrice();
    const tokenPriceBigInt = ethers.parseEther(tokenPriceWei);
    const ethAmountWei = ethers.parseEther(ethAmount);
    
    // Calculate: (ethAmount * 10^18) / tokenPrice
    const tokensWei = (ethAmountWei * ethers.parseEther("1")) / tokenPriceBigInt;
    return ethers.formatEther(tokensWei);
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
    console.log('=== SET CONTRIBUTION LEVEL ===');
    console.log('LaporanId:', laporanId);
    console.log('Level:', level);
    
    // Get signer address for permission check
    const signerAddress = await this.signer.getAddress();
    console.log('Signer address:', signerAddress);
    
    // Get report details to check institution ID
    const laporan = await this.getLaporan(laporanId);
    const institusiId = Number(laporan.institusiId);
    console.log('Report institution ID:', institusiId);
    
    // Check if signer is admin of the institution
    try {
      const [, admin] = await this.getInstitusiData(institusiId);
      console.log('Institution admin:', admin);
      console.log('Is admin?', admin.toLowerCase() === signerAddress.toLowerCase());
      
      if (admin.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error(`Hanya admin institusi yang dapat mengatur level kontribusi. Admin: ${admin}, Signer: ${signerAddress}`);
      }
    } catch (error) {
      console.error('Error checking admin permissions:', error);
      throw new Error(`Gagal memeriksa izin admin: ${error.message}`);
    }
    
    // Validate level range (typically 1-5 based on common contribution systems)
    if (level < 1 || level > 5) {
      throw new Error('Level kontribusi harus antara 1-5');
    }
    
    console.log('All validations passed, calling adminSetContribution...');
    
    // Use the new adminSetContribution function from Institusi contract
    const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
    
    return this.executeTransaction(
      () => institusiContract.adminSetContribution(laporanId, level),
      'adminSetContribution'
    );
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
    
    // Check if report is eligible for appeal (must be 'Tidak Valid')
    const laporan = await this.getLaporan(laporanId);
    if (laporan.status !== 'Tidak Valid') {
      throw new Error('Hanya laporan dengan status "Tidak Valid" yang dapat dibanding');
    }
    
    // Check if already appealed
    const isAlreadyAppealed = await this.isBanding(laporanId);
    if (isAlreadyAppealed) {
      throw new Error('Laporan ini sudah dalam proses banding');
    }
    
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

  async isBanding(laporanId: number): Promise<boolean> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
    return await contract.isBanding(laporanId);
  }

  async getHasilValidasi(laporanId: number) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
    return await contract.hasilValidasi(laporanId);
  }

  // Wrapper method for laporanSudahDivalidasi to maintain compatibility with existing code
  async isLaporanSudahDivalidasi(laporanId: number): Promise<boolean> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
    return await contract.laporanSudahDivalidasi(laporanId);
  }

  // Enhanced validation result method for better error handling
  async getEnhancedValidationResult(laporanId: number): Promise<any> {
    try {
      const validationResult = await this.getHasilValidasi(laporanId);
      return {
        ...validationResult,
        fetchMethod: 'enhanced',
        hasError: false
      };
    } catch (error) {
      console.warn(`Enhanced validation result failed for report ${laporanId}:`, error);
      return {
        validator: '0x0000000000000000000000000000000000000000',
        isValid: false,
        deskripsi: `Error fetching validation data: ${error.message}`,
        timestamp: 0,
        hasError: true,
        errorType: 'FETCH_ERROR',
        fetchMethod: 'enhanced_fallback'
      };
    }
  }

  // Debug method for validation data issues
  async debugValidationDataIssues(laporanId: number): Promise<void> {
    console.log(`=== DEBUGGING VALIDATION DATA ISSUES FOR REPORT ${laporanId} ===`);
    
    try {
      // Try multiple methods to get validation data
      console.log('1. Attempting getHasilValidasi...');
      try {
        const validationResult = await this.getHasilValidasi(laporanId);
        console.log('✅ getHasilValidasi result:', validationResult);
      } catch (error) {
        console.log('❌ getHasilValidasi failed:', error.message);
      }

      console.log('2. Checking validation status...');
      try {
        const isValidated = await this.isLaporanSudahDivalidasi(laporanId);
        console.log('✅ isLaporanSudahDivalidasi result:', isValidated);
      } catch (error) {
        console.log('❌ isLaporanSudahDivalidasi failed:', error.message);
      }

      console.log('3. Getting report details...');
      try {
        const reportData = await this.getLaporan(laporanId);
        console.log('✅ Report data:', reportData);
      } catch (error) {
        console.log('❌ getLaporan failed:', error.message);
      }

      console.log('4. Running comprehensive debug...');
      console.log('✅ Debug validation data issues completed successfully');

    } catch (error) {
      console.error('❌ Debug validation data issues failed:', error);
    }
  }

  // Helper Methods
  async setRewardManagerContracts(institusiContract: string, userContract: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    return await contract.setContracts(institusiContract, userContract);
  }

  // Debug method for validation status - returns validation info suitable for contribution setting
  async debugValidationStatus(laporanId: number): Promise<any> {
    console.log(`=== DEBUG VALIDATION STATUS FOR REPORT ${laporanId} ===`);
    
    try {
      // Check if report is validated
      const isValidated = await this.isLaporanSudahDivalidasi(laporanId);
      
      let validationResult = null;
      let hasValidationResult = false;
      
      if (isValidated) {
        try {
          validationResult = await this.getHasilValidasi(laporanId);
          hasValidationResult = true;
          console.log('✅ Validation result found:', validationResult);
        } catch (error) {
          console.log('⚠️ Report is validated but validation result not accessible:', error.message);
        }
      }
      
      const debugInfo = {
        laporanId,
        isValidated,
        hasValidationResult,
        validationResult,
        canSetContribution: isValidated && hasValidationResult
      };
      
      console.log('Debug validation status result:', debugInfo);
      return debugInfo;
      
    } catch (error) {
      console.error('Error in debugValidationStatus:', error);
      return {
        laporanId,
        isValidated: false,
        hasValidationResult: false,
        validationResult: null,
        canSetContribution: false,
        error: error.message
      };
    }
  }

  // Debug method for appeal finalization
  async debugAppealFinalization(laporanId: number): Promise<any> {
    console.log('=== DEBUG APPEAL FINALIZATION ===');
    
    try {
      const signerAddress = await this.signer.getAddress();
      const laporan = await this.getLaporan(laporanId);
      const institusiId = Number(laporan.institusiId);
      const isBanding = await this.isBanding(laporanId);
      
      // Check institution data
      const [institutionName, admin, treasury] = await this.getInstitusiData(institusiId);
      
      // Check if contracts are properly initialized
      const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
      
      // Try to check if function exists
      let functionExists = false;
      try {
        const fragment = institusiContract.interface.getFunction('finalisasiBanding');
        functionExists = !!fragment;
      } catch (e) {
        functionExists = false;
      }
      
      const debugInfo = {
        signerAddress,
        institusiId,
        institutionName,
        institutionAdmin: admin,
        institutionTreasury: treasury,
        isAdmin: admin.toLowerCase() === signerAddress.toLowerCase(),
        reportStatus: laporan.status,
        isBanding,
        functionExists,
        contractAddresses: CONTRACT_ADDRESSES,
        reportData: laporan
      };
      
      console.log('Debug info:', debugInfo);
      return debugInfo;
      
    } catch (error) {
      console.error('Error in debug appeal finalization:', error);
      throw error;
    }
  }

  // Comprehensive debug method for appeal functionality
  async debugAppealFunctionality(laporanId: number): Promise<any> {
    console.log('=== COMPREHENSIVE APPEAL DEBUG ===');
    
    try {
      const debugInfo: any = {
        laporanId,
        userContractCheck: {},
        institusiContractCheck: {},
        rewardManagerCheck: {},
        overallStatus: 'unknown'
      };
      
      // 1. Check User Contract setup
      console.log('1. Checking User Contract...');
      try {
        const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
        const institusiAddr = await userContract.institusiContract();
        const rewardManagerAddr = await userContract.rewardManager();
        
        debugInfo.userContractCheck = {
          address: CONTRACT_ADDRESSES.user,
          institusiContractSet: institusiAddr,
          rewardManagerSet: rewardManagerAddr,
          isInstitusiCorrect: institusiAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase(),
          isRewardManagerCorrect: rewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
        };
      } catch (error) {
        debugInfo.userContractCheck.error = error.message;
      }
      
      // 2. Check Institusi Contract setup
      console.log('2. Checking Institusi Contract...');
      try {
        const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
        const userContractAddr = await institusiContract.userContract();
        const rewardManagerAddr = await institusiContract.rewardManager();
        
        debugInfo.institusiContractCheck = {
          address: CONTRACT_ADDRESSES.institusi,
          userContractSet: userContractAddr,
          rewardManagerSet: rewardManagerAddr,
          isUserCorrect: userContractAddr.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase(),
          isRewardManagerCorrect: rewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
        };
      } catch (error) {
        debugInfo.institusiContractCheck.error = error.message;
      }
      
      // 3. Check RewardManager Contract setup
      console.log('3. Checking RewardManager Contract...');
      try {
        const rewardManagerContract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.provider);
        
        // Try to get contract addresses if available
        let institusiContractInRM = '0x0000000000000000000000000000000000000000';
        let userContractInRM = '0x0000000000000000000000000000000000000000';
        
        try {
          institusiContractInRM = await rewardManagerContract.institusiContract?.() || '0x0000000000000000000000000000000000000000';
        } catch (e) { /* getter might not exist */ }
        
        try {
          userContractInRM = await rewardManagerContract.userContract?.() || '0x0000000000000000000000000000000000000000';
        } catch (e) { /* getter might not exist */ }
        
        debugInfo.rewardManagerCheck = {
          address: CONTRACT_ADDRESSES.rewardManager,
          institusiContractSet: institusiContractInRM,
          userContractSet: userContractInRM,
          isInstitusiCorrect: institusiContractInRM.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase(),
          isUserCorrect: userContractInRM.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase()
        };
      } catch (error) {
        debugInfo.rewardManagerCheck.error = error.message;
      }
      
      // 4. Check report details
      console.log('4. Checking Report Details...');
      try {
        const laporan = await this.getLaporan(laporanId);
        const isBanding = await this.isBanding(laporanId);
        
        debugInfo.reportDetails = {
          laporanId: laporan.laporanId,
          institusiId: laporan.institusiId,
          status: laporan.status,
          isBanding: isBanding,
          pelapor: laporan.pelapor
        };
      } catch (error) {
        debugInfo.reportDetails = { error: error.message };
      }
      
      // 5. Overall status assessment
      const userOk = debugInfo.userContractCheck.isInstitusiCorrect && debugInfo.userContractCheck.isRewardManagerCorrect;
      const institusiOk = debugInfo.institusiContractCheck.isUserCorrect && debugInfo.institusiContractCheck.isRewardManagerCorrect;
      const rewardManagerOk = debugInfo.rewardManagerCheck.isInstitusiCorrect && debugInfo.rewardManagerCheck.isUserCorrect;
      
      if (userOk && institusiOk && rewardManagerOk) {
        debugInfo.overallStatus = 'all_contracts_properly_configured';
      } else {
        debugInfo.overallStatus = 'contract_configuration_issues';
        debugInfo.issues = {
          userContract: !userOk,
          institusiContract: !institusiOk,
          rewardManager: !rewardManagerOk
        };
      }
      
      console.log('=== COMPREHENSIVE DEBUG RESULT ===', debugInfo);
      return debugInfo;
      
    } catch (error) {
      console.error('Error in comprehensive appeal debug:', error);
      return { error: error.message };
    }
  }

  // Comprehensive diagnosis method for the "Hanya Institusi Contract" error
  async diagnoseAppealFlow(laporanId: number): Promise<any> {
    console.log('=== COMPREHENSIVE APPEAL FLOW DIAGNOSIS ===');
    
    try {
      const diagnosis: any = {
        step1_adminCheck: {},
        step2_contractSetup: {},
        step3_flowAnalysis: {},
        recommendations: []
      };
      
      // Step 1: Check admin permissions
      console.log('Step 1: Checking admin permissions...');
      const signerAddress = await this.signer.getAddress();
      const laporan = await this.getLaporan(laporanId);
      const institusiId = Number(laporan.institusiId);
      const [, admin] = await this.getInstitusiData(institusiId);
      
      diagnosis.step1_adminCheck = {
        signerAddress,
        institusiId,
        institutionAdmin: admin,
        isAdmin: admin.toLowerCase() === signerAddress.toLowerCase(),
        reportStatus: laporan.status,
        reportData: laporan
      };
      
      // Step 2: Contract setup analysis
      console.log('Step 2: Analyzing contract setup...');
      const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
      const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
      
      // Check User contract setup
      try {
        const userInstitusiAddr = await userContract.institusiContract();
        const userRewardManagerAddr = await userContract.rewardManager();
        
        diagnosis.step2_contractSetup.userContract = {
          address: CONTRACT_ADDRESSES.user,
          institusiContractSet: userInstitusiAddr,
          rewardManagerSet: userRewardManagerAddr,
          isInstitusiCorrect: userInstitusiAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase(),
          isRewardManagerCorrect: userRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
        };
      } catch (error) {
        diagnosis.step2_contractSetup.userContract = { error: error.message };
      }
      
      // Check Institusi contract setup
      try {
        const institusiUserAddr = await institusiContract.userContract();
        const institusiRewardManagerAddr = await institusiContract.rewardManager();
        
        diagnosis.step2_contractSetup.institusiContract = {
          address: CONTRACT_ADDRESSES.institusi,
          userContractSet: institusiUserAddr,
          rewardManagerSet: institusiRewardManagerAddr,
          isUserCorrect: institusiUserAddr.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase(),
          isRewardManagerCorrect: institusiRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
        };
      } catch (error) {
        diagnosis.step2_contractSetup.institusiContract = { error: error.message };
      }
      
      // Step 3: Flow analysis
      console.log('Step 3: Analyzing expected appeal flow...');
      diagnosis.step3_flowAnalysis = {
        expectedFlow: [
          '1. Admin calls adminFinalisasiBanding() on Institusi contract',
          '2. Institusi contract calls finalisasiBanding() on User contract',
          '3. User contract updates report status and handles stake',
          '4. If stake return needed, User contract should either:',
          '   a) Handle stake internally, OR',
          '   b) Call RewardManager through Institusi contract'
        ],
        currentIssue: 'User contract is calling RewardManager directly',
        possibleCause: 'User contract is calling RewardManager functions that expect calls from Institusi contract only'
      };
      
      // Recommendations
      if (diagnosis.step2_contractSetup.userContract?.isInstitusiCorrect && 
          diagnosis.step2_contractSetup.institusiContract?.isUserCorrect) {
        diagnosis.recommendations.push('✅ Contract references are correct');
        diagnosis.recommendations.push('💡 Issue is likely in the appeal stake handling logic');
        diagnosis.recommendations.push('🔧 Solution: User contract should not call RewardManager directly');
        diagnosis.recommendations.push('🔧 Solution: Appeal stake should be handled by Institusi contract or within User contract');
      } else {
        diagnosis.recommendations.push('❌ Contract references need to be fixed first');
        diagnosis.recommendations.push('🔧 Run fixUserContractForAppeals() to fix setup');
      }
      
      console.log('=== DIAGNOSIS RESULT ===', diagnosis);
      return diagnosis;
      
    } catch (error) {
      console.error('Error in appeal flow diagnosis:', error);
      return { error: error.message };
    }
  }

  // Method to analyze and provide solutions for "Hanya Institusi Contract" error
  async analyzeHanyaInstitusiError(laporanId: number): Promise<any> {
    console.log('=== ANALYZING "HANYA INSTITUSI CONTRACT" ERROR ===');
    
    try {
      const analysis: any = {
        errorType: 'Hanya Institusi Contract',
        problemSource: 'unknown',
        possibleCauses: [],
        recommendedSolutions: [],
        contractFlow: [],
        diagnostics: {}
      };
      
      // Analyze the expected flow
      analysis.contractFlow = [
        '1. Admin calls adminFinalisasiBanding() on Institusi contract ✅',
        '2. Institusi contract calls finalisasiBanding() on User contract ✅',
        '3. User contract processes appeal and updates status ✅',
        '4. User contract tries to call RewardManager for stake handling ❌ ERROR HERE',
        '5. RewardManager rejects because caller is User contract, not Institusi contract'
      ];
      
      // Identify possible causes
      analysis.possibleCauses = [
        'RewardManager is configured to only accept calls from Institusi contract',
        'User contract is calling RewardManager.returnAppealStake() directly',
        'Appeal stake handling logic is incorrect in User contract',
        'RewardManager access control is too restrictive for appeal flow'
      ];
      
      // Check current contract setup
      console.log('Checking current contract configurations...');
      
      try {
        const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
        const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
        
        // Check User contract setup
        const userInstitusiAddr = await userContract.institusiContract();
        const userRewardManagerAddr = await userContract.rewardManager();
        
        // Check Institusi contract setup
        const institusiUserAddr = await institusiContract.userContract();
        const institusiRewardManagerAddr = await institusiContract.rewardManager();
        
        analysis.diagnostics = {
          userContract: {
            address: CONTRACT_ADDRESSES.user,
            institusiContractSet: userInstitusiAddr,
            rewardManagerSet: userRewardManagerAddr,
            pointsToCorrectInstitusi: userInstitusiAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase(),
            pointsToCorrectRewardManager: userRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
          },
          institusiContract: {
            address: CONTRACT_ADDRESSES.institusi,
            userContractSet: institusiUserAddr,
            rewardManagerSet: institusiRewardManagerAddr,
            pointsToCorrectUser: institusiUserAddr.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase(),
            pointsToCorrectRewardManager: institusiRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
          }
        };
        
        // Determine the problem source based on diagnostics
        if (analysis.diagnostics.userContract.pointsToCorrectInstitusi && 
            analysis.diagnostics.userContract.pointsToCorrectRewardManager) {
          analysis.problemSource = 'RewardManager access control';
          analysis.recommendedSolutions = [
            '🔧 SOLUTION 1: Modify RewardManager to accept User contract calls for appeal functions',
            '🔧 SOLUTION 2: Change User contract to call RewardManager through Institusi contract',
            '🔧 SOLUTION 3: Handle appeal stakes entirely within User contract without calling RewardManager',
            '🔧 SOLUTION 4: Add a proxy function in Institusi contract for RewardManager calls'
          ];
        } else {
          analysis.problemSource = 'Contract setup issues';
          analysis.recommendedSolutions = [
            '🔧 Fix contract references first using fixUserContractForAppeals()',
            '🔧 Ensure all contracts point to correct addresses',
            '🔧 Re-run contract initialization'
          ];
        }
        
      } catch (setupError) {
        analysis.diagnostics.error = setupError.message;
        analysis.problemSource = 'Contract setup error';
      }
      
      // Report information
      try {
        const laporan = await this.getLaporan(laporanId);
        analysis.reportInfo = {
          id: laporanId,
          status: laporan.status,
          institusiId: Number(laporan.institusiId),
          pelapor: laporan.pelapor
        };
      } catch (reportError) {
        analysis.reportInfo = { error: reportError.message };
      }
      
      console.log('=== ANALYSIS COMPLETE ===', analysis);
      return analysis;
      
    } catch (error) {
      console.error('Error in Hanya Institusi Contract analysis:', error);
      return { error: error.message };
    }
  }

  async diagnoseAppealFinalizationFailure(laporanId: number, userMenang: boolean): Promise<any> {
    console.log('🔍 COMPREHENSIVE APPEAL FINALIZATION DIAGNOSIS');
    console.log('═'.repeat(60));
    
    const diagnosis: any = {
      step1_basicChecks: {},
      step2_contractStates: {},
      step3_permissionChecks: {},
      step4_functionValidation: {},
      step5_recommendations: []
    };
    
    try {
      const signerAddress = await this.signer.getAddress();
      console.log(`📋 Diagnosing appeal finalization for Report ${laporanId}`);
      console.log(`👤 Signer: ${signerAddress}`);
      console.log(`🎯 User Wins: ${userMenang}`);
      
      // STEP 1: Basic Checks
      console.log('\n🔍 STEP 1: Basic Validation Checks');
      console.log('─'.repeat(40));
      
      try {
        const laporan = await this.getLaporan(laporanId);
        const isBanding = await this.isBanding(laporanId);
        
        diagnosis.step1_basicChecks = {
          reportExists: true,
          reportData: {
            id: laporan.laporanId,
            institusiId: Number(laporan.institusiId),
            status: laporan.status,
            pelapor: laporan.pelapor
          },
          isBanding: isBanding,
          statusValid: laporan.status === 'Banding',
          bandingStatusMatches: isBanding === (laporan.status === 'Banding')
        };
        
        console.log(`✅ Report exists: ID ${laporan.laporanId}`);
        console.log(`📊 Status: ${laporan.status}`);
        console.log(`🏛️ Institution: ${laporan.institusiId}`);
        console.log(`👤 Reporter: ${laporan.pelapor}`);
        console.log(`⚖️ Is Banding: ${isBanding}`);
        console.log(`✅ Status check: ${diagnosis.step1_basicChecks.statusValid ? 'PASS' : 'FAIL'}`);
        
      } catch (error) {
        console.log(`❌ Basic checks failed: ${error.message}`);
        diagnosis.step1_basicChecks.error = error.message;
        return diagnosis;
      }
      
      // STEP 2: Contract State Analysis
      console.log('\n🔍 STEP 2: Contract State Analysis');
      console.log('─'.repeat(40));
      
      try {
        const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
        const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
        const rewardManagerContract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.provider);
        
        // Check User contract setup
        const userInstitusiAddr = await userContract.institusiContract();
        const userRewardManagerAddr = await userContract.rewardManager();
        
        // Check Institusi contract setup
        const institusiUserAddr = await institusiContract.userContract();
        const institusiRewardManagerAddr = await institusiContract.rewardManager();
        
        // Check RewardManager setup
        let rmInstitusiAddr = '0x0000000000000000000000000000000000000000';
        let rmUserAddr = '0x0000000000000000000000000000000000000000';
        
        try {
          rmInstitusiAddr = await rewardManagerContract.institusiContract();
          rmUserAddr = await rewardManagerContract.userContract();
        } catch (rmError) {
          console.log('⚠️ RewardManager getters not available or accessible');
        }
        
        diagnosis.step2_contractStates = {
          userContract: {
            address: CONTRACT_ADDRESSES.user,
            institusiSet: userInstitusiAddr,
            rewardManagerSet: userRewardManagerAddr,
            institusiCorrect: userInstitusiAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase(),
            rewardManagerCorrect: userRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
          },
          institusiContract: {
            address: CONTRACT_ADDRESSES.institusi,
            userSet: institusiUserAddr,
            rewardManagerSet: institusiRewardManagerAddr,
            userCorrect: institusiUserAddr.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase(),
            rewardManagerCorrect: institusiRewardManagerAddr.toLowerCase() === CONTRACT_ADDRESSES.rewardManager.toLowerCase()
          },
          rewardManager: {
            address: CONTRACT_ADDRESSES.rewardManager,
            institusiSet: rmInstitusiAddr,
            userSet: rmUserAddr,
            institusiCorrect: rmInstitusiAddr.toLowerCase() === CONTRACT_ADDRESSES.institusi.toLowerCase(),
            userCorrect: rmUserAddr.toLowerCase() === CONTRACT_ADDRESSES.user.toLowerCase()
          }
        };
        
        console.log('📊 User Contract State:');
        console.log(`  Institusi ref: ${userInstitusiAddr} ${diagnosis.step2_contractStates.userContract.institusiCorrect ? '✅' : '❌'}`);
        console.log(`  RewardMgr ref: ${userRewardManagerAddr} ${diagnosis.step2_contractStates.userContract.rewardManagerCorrect ? '✅' : '❌'}`);
        
        console.log('📊 Institusi Contract State:');
        console.log(`  User ref: ${institusiUserAddr} ${diagnosis.step2_contractStates.institusiContract.userCorrect ? '✅' : '❌'}`);
        console.log(`  RewardMgr ref: ${institusiRewardManagerAddr} ${diagnosis.step2_contractStates.institusiContract.rewardManagerCorrect ? '✅' : '❌'}`);
        
        console.log('📊 RewardManager State:');
        console.log(`  Institusi ref: ${rmInstitusiAddr} ${diagnosis.step2_contractStates.rewardManager.institusiCorrect ? '✅' : '❌'}`);
        console.log(`  User ref: ${rmUserAddr} ${diagnosis.step2_contractStates.rewardManager.userCorrect ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`❌ Contract state analysis failed: ${error.message}`);
        diagnosis.step2_contractStates.error = error.message;
      }
      
      // STEP 3: Permission Checks
      console.log('\n🔍 STEP 3: Permission Validation');
      console.log('─'.repeat(40));
      
      try {
        const institusiId = diagnosis.step1_basicChecks.reportData.institusiId;
        const [institutionName, admin, treasury] = await this.getInstitusiData(institusiId);
        
        diagnosis.step3_permissionChecks = {
          institusiId,
          institutionName,
          admin,
          treasury,
          signerAddress,
          isAdmin: admin.toLowerCase() === signerAddress.toLowerCase()
        };
        
        console.log(`🏛️ Institution: ${institutionName} (ID: ${institusiId})`);
        console.log(`👨‍💼 Admin: ${admin}`);
        console.log(`💰 Treasury: ${treasury}`);
        console.log(`👤 Signer: ${signerAddress}`);
        console.log(`🔐 Is Admin: ${diagnosis.step3_permissionChecks.isAdmin ? '✅ YES' : '❌ NO'}`);
        
        if (!diagnosis.step3_permissionChecks.isAdmin) {
          diagnosis.step5_recommendations.push('❌ CRITICAL: Signer is not institution admin');
          diagnosis.step5_recommendations.push(`💡 Solution: Use admin wallet ${admin}`);
        }
        
      } catch (error) {
        console.log(`❌ Permission checks failed: ${error.message}`);
        diagnosis.step3_permissionChecks.error = error.message;
      }
      
      // STEP 4: Function Validation
      console.log('\n🔍 STEP 4: Function Call Validation');
      console.log('─'.repeat(40));
      
      try {
        const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
        
        // Check if function exists in ABI
        const hasFunction = institusiContract.interface.hasFunction('adminFinalisasiBanding');
        console.log(`📞 Function exists: ${hasFunction ? '✅ YES' : '❌ NO'}`);
        
        if (hasFunction) {
          // Try to estimate gas for the function call
          try {
            const gasEstimate = await institusiContract.adminFinalisasiBanding.estimateGas(laporanId, userMenang);
            console.log(`⛽ Gas estimate: ${gasEstimate.toString()} ✅`);
            
            diagnosis.step4_functionValidation = {
              functionExists: true,
              gasEstimateSuccessful: true,
              estimatedGas: gasEstimate.toString()
            };
          } catch (gasError) {
            console.log(`⛽ Gas estimation failed: ${gasError.message} ❌`);
            console.log('🔍 This indicates the transaction would revert');
            
            diagnosis.step4_functionValidation = {
              functionExists: true,
              gasEstimateSuccessful: false,
              gasError: gasError.message
            };
            
            // Try to get more specific error using staticCall
            try {
              console.log('🔍 Attempting static call to get revert reason...');
              await institusiContract.adminFinalisasiBanding.staticCall(laporanId, userMenang);
            } catch (staticError) {
              console.log(`🔍 Static call error: ${staticError.message}`);
              diagnosis.step4_functionValidation.staticCallError = staticError.message;
              
              // Parse common error patterns
              if (staticError.message.includes('Hanya admin')) {
                diagnosis.step5_recommendations.push('❌ ERROR: Not authorized as admin');
              } else if (staticError.message.includes('Tidak Valid')) {
                diagnosis.step5_recommendations.push('❌ ERROR: Report status not valid for appeal finalization');
              } else if (staticError.message.includes('Hanya Institusi Contract')) {
                diagnosis.step5_recommendations.push('❌ ERROR: RewardManager access control issue detected');
                diagnosis.step5_recommendations.push('💡 Solution: RewardManager needs to accept calls from User contract');
              }
            }
          }
        } else {
          diagnosis.step4_functionValidation = {
            functionExists: false
          };
          diagnosis.step5_recommendations.push('❌ CRITICAL: adminFinalisasiBanding function not found in contract ABI');
        }
        
      } catch (error) {
        console.log(`❌ Function validation failed: ${error.message}`);
        diagnosis.step4_functionValidation.error = error.message;
      }
      
      // STEP 5: Generate Recommendations
      console.log('\n💡 STEP 5: Recommendations');
      console.log('─'.repeat(40));
      
      if (diagnosis.step5_recommendations.length === 0) {
        diagnosis.step5_recommendations.push('🤔 No obvious issues detected - may be a gas or timing issue');
        diagnosis.step5_recommendations.push('💡 Try increasing gas limit or retrying transaction');
      }
      
      diagnosis.step5_recommendations.forEach(rec => console.log(rec));
      
      return diagnosis;
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      diagnosis.error = error.message;
      return diagnosis;
    }
  }

  // === PRE-FLIGHT CHECK FOR APPEAL FINALIZATION ===
  
  async preFlightCheckAppealFinalization(laporanId: number, userMenang: boolean): Promise<{
    canProceed: boolean;
    issues: string[];
    reportData: any;
  }> {
    const issues: string[] = [];
    
    try {
      console.log('=== PRE-FLIGHT CHECK APPEAL FINALIZATION ===');
      console.log(`Report ID: ${laporanId}, User Wins: ${userMenang}`);
      
      // 1. Check signer authorization
      const signerAddress = await this.signer.getAddress();
      console.log(`✅ Signer address: ${signerAddress}`);
      
      // 2. Get report data
      const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
      const reportData = await userContract.laporan(laporanId);
      const institusiId = reportData.institusiId;
      
      console.log(`✅ Report data retrieved: ID=${reportData.laporanId}, Status=${reportData.status}, InstitusiID=${institusiId}`);
      
      // 3. Check if admin of institution
      const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
      const [nama, admin, treasury] = await institusiContract.getInstitusiData(institusiId);
      
      if (signerAddress.toLowerCase() !== admin.toLowerCase()) {
        issues.push(`❌ AUTHORIZATION: Signer ${signerAddress} is not admin ${admin} of institution ${institusiId}`);
      } else {
        console.log(`✅ Admin authorization confirmed for institution "${nama}"`);
      }
      
      // 4. Check if report is in banding status
      const isBandingStatus = await userContract.isBanding(laporanId);
      if (!isBandingStatus) {
        issues.push(`❌ APPEAL STATUS: Report ${laporanId} is not in banding status (isBanding: ${isBandingStatus})`);
      } else {
        console.log(`✅ Report is in appeal status`);
      }
      
      // 5. Check report status matches
      if (reportData.status !== 'Banding') {
        issues.push(`❌ STATUS MISMATCH: Report status is "${reportData.status}" but should be "Banding"`);
      } else {
        console.log(`✅ Report status is "Banding"`);
      }
      
      // 6. Check contracts are properly connected
      const institusiContractAddr = await userContract.institusiContractAddress();
      if (institusiContractAddr.toLowerCase() !== CONTRACT_ADDRESSES.institusi.toLowerCase()) {
        issues.push(`❌ CONTRACT SETUP: User contract institusi address mismatch: ${institusiContractAddr} vs ${CONTRACT_ADDRESSES.institusi}`);
      } else {
        console.log(`✅ User contract properly connected to Institusi contract`);
      }
      
      // 7. Check RewardManager has enough tokens for operations
      const rtkContract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.provider);
      const rewardManagerBalance = await rtkContract.balanceOf(CONTRACT_ADDRESSES.rewardManager);
      const stakeAmount = await userContract.STAKE_BANDING_AMOUNT();
      
      if (rewardManagerBalance < stakeAmount) {
        issues.push(`❌ INSUFFICIENT BALANCE: RewardManager balance ${ethers.formatEther(rewardManagerBalance)} RTK < required ${ethers.formatEther(stakeAmount)} RTK`);
      } else {
        console.log(`✅ RewardManager has sufficient balance: ${ethers.formatEther(rewardManagerBalance)} RTK`);
      }
      
      // 8. Check if validator exists for the report (for slashing operation)
      if (userMenang && reportData.validatorAddress === ethers.ZeroAddress) {
        issues.push(`⚠️ WARNING: User wins but no validator address to slash (validatorAddress: ${reportData.validatorAddress})`);
      } else if (userMenang) {
        console.log(`✅ Validator address available for slashing: ${reportData.validatorAddress}`);
      }
      
      // 9. Test gas estimation (dry run)
      try {
        const gasEstimate = await institusiContract.adminFinalisasiBanding.estimateGas(laporanId, userMenang);
        console.log(`✅ Gas estimation successful: ${gasEstimate.toString()}`);
      } catch (gasError: any) {
        issues.push(`❌ GAS ESTIMATION FAILED: ${gasError.message || gasError.reason || 'Unknown gas estimation error'}`);
      }
      
      // 10. Test static call (simulation)
      try {
        await institusiContract.adminFinalisasiBanding.staticCall(laporanId, userMenang);
        console.log(`✅ Static call simulation successful`);
      } catch (staticError: any) {
        issues.push(`❌ STATIC CALL FAILED: ${staticError.message || staticError.reason || 'Transaction would revert'}`);
      }
      
      const finalResult = {
        canProceed: issues.length === 0,
        issues,
        reportData: {
          laporanId: reportData.laporanId.toString(),
          institusiId: reportData.institusiId.toString(),
          pelapor: reportData.pelapor,
          status: reportData.status,
          validatorAddress: reportData.validatorAddress,
          isBanding: isBandingStatus,
          admin,
          treasury,
          signerAddress,
          institutionName: nama,
          stakeAmount: ethers.formatEther(stakeAmount),
          rewardManagerBalance: ethers.formatEther(rewardManagerBalance)
        }
      };
      
      console.log('=== PRE-FLIGHT CHECK RESULTS ===');
      console.log(`Can proceed: ${finalResult.canProceed}`);
      if (finalResult.issues.length > 0) {
        console.log('Issues found:');
        finalResult.issues.forEach(issue => console.log(issue));
      }
      
      return finalResult;
      
    } catch (error: any) {
      issues.push(`❌ PRE-FLIGHT CHECK FAILED: ${error.message}`);
      return { 
        canProceed: false, 
        issues, 
        reportData: null 
      };
    }
  }

  // === SMART CONTRACT BUG WORKAROUND ===
  
  /**
   * Alternative appeal finalization that attempts to work around smart contract bugs
   * This method provides detailed debugging and alternative approaches
   */
  async finalisasiBandingWithWorkaround(laporanId: number, userMenang: boolean): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
    diagnostics: any;
  }> {
    console.log('🔧 APPEAL FINALIZATION WITH WORKAROUND');
    console.log(`Report ID: ${laporanId}, User Wins: ${userMenang}`);
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      reportId: laporanId,
      userWins: userMenang,
      steps: []
    };
    
    try {
      // Step 1: Get current signer and report details
      const signerAddress = await this.signer.getAddress();
      const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
      const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
      
      diagnostics.signer = signerAddress;
      diagnostics.steps.push('✅ Contracts initialized');
      
      // Step 2: Get report data
      const reportData = await userContract.laporan(laporanId);
      const institusiId = reportData.institusiId;
      
      diagnostics.reportData = {
        id: reportData.laporanId.toString(),
        institusiId: reportData.institusiId.toString(),
        status: reportData.status,
        pelapor: reportData.pelapor
      };
      diagnostics.steps.push('✅ Report data retrieved');
      
      // Step 3: Get institution admin data
      const [nama, admin, treasury] = await institusiContract.getInstitusiData(institusiId);
      
      diagnostics.institutionData = {
        id: institusiId.toString(),
        name: nama,
        admin,
        treasury,
        isCurrentUserAdmin: admin.toLowerCase() === signerAddress.toLowerCase()
      };
      diagnostics.steps.push('✅ Institution data retrieved');
      
      // Step 4: Check if we are the admin
      if (admin.toLowerCase() !== signerAddress.toLowerCase()) {
        const error = `Authorization failed: Current user ${signerAddress} is not admin ${admin} of institution ${nama}`;
        diagnostics.steps.push(`❌ ${error}`);
        return {
          success: false,
          error,
          diagnostics
        };
      }
      
      diagnostics.steps.push('✅ Authorization confirmed');
      
      // Step 5: Try different approaches based on the smart contract bug
      
      // Approach 1: Try the standard way first
      console.log('🔄 Approach 1: Standard adminFinalisasiBanding...');
      try {
        const institusiContractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
        
        // Test with static call first
        await institusiContractWithSigner.adminFinalisasiBanding.staticCall(laporanId, userMenang);
        
        // If static call succeeds, send actual transaction
        const tx = await institusiContractWithSigner.adminFinalisasiBanding(laporanId, userMenang);
        diagnostics.steps.push('✅ Standard approach succeeded');
        
        return {
          success: true,
          txHash: tx.hash,
          diagnostics
        };
        
      } catch (standardError: any) {
        console.log('❌ Standard approach failed:', standardError.reason || standardError.message);
        diagnostics.steps.push(`❌ Standard approach failed: ${standardError.reason || standardError.message}`);
        
        // If standard approach fails due to admin check, there might be a smart contract bug
        if (standardError.reason === 'Hanya admin dari institusi terkait') {
          
          // Approach 2: Check if there's a contract deployment issue
          console.log('🔄 Approach 2: Checking contract deployment...');
          
          // Verify that the contract we're calling has the right admin data
          try {
            const onChainInstitusiId = reportData.institusiId;
            const [onChainNama, onChainAdmin] = await institusiContract.getInstitusiData(onChainInstitusiId);
            
            if (onChainAdmin.toLowerCase() !== signerAddress.toLowerCase()) {
              const error = `Contract data mismatch: On-chain admin ${onChainAdmin} != current user ${signerAddress}`;
              diagnostics.steps.push(`❌ ${error}`);
              return {
                success: false,
                error,
                diagnostics
              };
            }
            
            // Approach 3: Try calling with explicit gas limit
            console.log('🔄 Approach 3: Explicit gas limit...');
            try {
              const institusiContractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
              const gasEstimate = await institusiContractWithSigner.adminFinalisasiBanding.estimateGas(laporanId, userMenang);
              const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer
              
              const tx = await institusiContractWithSigner.adminFinalisasiBanding(laporanId, userMenang, {
                gasLimit
              });
              
              diagnostics.steps.push('✅ Explicit gas limit approach succeeded');
              return {
                success: true,
                txHash: tx.hash,
                diagnostics
              };
              
            } catch (gasError: any) {
              console.log('❌ Gas limit approach failed:', gasError.reason || gasError.message);
              diagnostics.steps.push(`❌ Gas limit approach failed: ${gasError.reason || gasError.message}`);
            }
            
          } catch (contractError: any) {
            diagnostics.steps.push(`❌ Contract verification failed: ${contractError.message}`);
          }
        }
      }
      
      // If all approaches fail, return comprehensive diagnostics
      const finalError = 'All workaround approaches failed. This indicates a smart contract bug that requires contract updates.';
      diagnostics.steps.push(`❌ ${finalError}`);
      
      return {
        success: false,
        error: finalError,
        diagnostics
      };
      
    } catch (error: any) {
      const errorMessage = `Workaround failed: ${error.message}`;
      diagnostics.steps.push(`❌ ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        diagnostics
      };
    }
  }

  // === MISSING METHODS IMPLEMENTATION ===

  // Method to initialize all contracts - comprehensive initialization
  async initializeContracts(): Promise<void> {
    console.log('=== INITIALIZING ALL CONTRACTS ===');
    
    try {
      // Initialize User contract
      await this.initializeUserContract();
      
      // Initialize RewardManager contract references
      await this.fixRewardManagerSetup();
      
      console.log('✅ All contracts initialized successfully');
    } catch (error: any) {
      console.error('❌ Contract initialization failed:', error);
      throw new Error(`Contract initialization failed: ${error.message}`);
    }
  }

  // Method to fix RewardManager contract setup
  async fixRewardManagerSetup(): Promise<void> {
    console.log('=== FIXING REWARD MANAGER SETUP ===');
    
    try {
      const rewardManagerContract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
      
      // Check if RewardManager has the correct contract references
      try {
        // Try to get current contract references if the functions exist
        let needsSetup = false;
        
        try {
          const institusiAddr = await rewardManagerContract.institusiContract?.();
          const userAddr = await rewardManagerContract.userContract?.();
          
          if (institusiAddr.toLowerCase() !== CONTRACT_ADDRESSES.institusi.toLowerCase() ||
              userAddr.toLowerCase() !== CONTRACT_ADDRESSES.user.toLowerCase()) {
            needsSetup = true;
          }
        } catch {
          // Functions might not exist, try to set them anyway
          needsSetup = true;
        }
        
        if (needsSetup) {
          console.log('Setting RewardManager contract references...');
          const tx = await rewardManagerContract.setContracts(
            CONTRACT_ADDRESSES.institusi,
            CONTRACT_ADDRESSES.user
          );
          
          console.log('RewardManager setup transaction:', tx.hash);
          await tx.wait();
          console.log('✅ RewardManager setup completed successfully');
        } else {
          console.log('✅ RewardManager already properly configured');
        }
        
      } catch (error: any) {
        console.log('⚠️ RewardManager setup attempt failed (may not have setContracts function):', error.message);
        // This is not critical as some contracts may not have this function
      }
      
    } catch (error: any) {
      console.error('❌ RewardManager setup failed:', error);
      throw error;
    }
  }

  // Method to get Validasi struct data specifically
  async getValidasiStructData(laporanId: number): Promise<any> {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
      
      // First try the dedicated getValidasiStructData function if it exists
      try {
        const result = await contract.getValidasiStructData(laporanId);
        console.log('✅ getValidasiStructData result:', result);
        return {
          validator: result[0],
          isValid: result[1],
          deskripsi: result[2],
          timestamp: result[3],
          hasIssues: result[4] || false,
          dataSource: result[5] || 'getValidasiStructData',
          rawData: result[6] || JSON.stringify(result)
        };
      } catch (structError) {
        console.log('⚠️ getValidasiStructData function not available, falling back to hasilValidasi');
        
        // Fallback to the standard hasilValidasi function
        const validationResult = await contract.hasilValidasi(laporanId);
        return {
          validator: validationResult.validator,
          isValid: validationResult.isValid,
          deskripsi: validationResult.deskripsi,
          timestamp: validationResult.timestamp,
          hasIssues: false,
          dataSource: 'hasilValidasi_fallback',
          rawData: JSON.stringify(validationResult)
        };
      }
    } catch (error: any) {
      console.error('❌ getValidasiStructData failed:', error);
      throw new Error(`Failed to get validation struct data: ${error.message}`);
    }
  }

  // Validator method for report validation
  async validasiLaporan(laporanId: number, isValid: boolean, description: string): Promise<ethers.ContractTransactionResponse> {
    console.log('=== SUBMITTING VALIDATION ===');
    console.log(`Report ID: ${laporanId}, Is Valid: ${isValid}, Description: ${description}`);
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.signer);
      
      // Validate inputs
      if (!laporanId || laporanId <= 0) {
        throw new Error('Invalid report ID');
      }
      
      if (!description || description.trim() === '') {
        throw new Error('Validation description cannot be empty');
      }
      
      const cleanDescription = description.trim();
      
      // Submit validation
      const tx = await contract.validasiLaporan(laporanId, isValid, cleanDescription);
      console.log('Validation transaction submitted:', tx.hash);
      
      return tx;
      
    } catch (error: any) {
      console.error('❌ Validation submission failed:', error);
      throw new Error(`Failed to submit validation: ${error.message}`);
    }
  }

  // Method to get stake amount required for appeals  
  async getStakeBandingAmount(): Promise<string> {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
      
      // Try to get the stake amount from User contract
      const stakeAmount = await contract.STAKE_BANDING_AMOUNT();
      return ethers.formatEther(stakeAmount);
      
    } catch (error: any) {
      console.error('❌ Failed to get stake banding amount:', error);
      
      // Fallback to a reasonable default if the function doesn't exist
      console.log('⚠️ Using fallback stake amount');
      return "10.0"; // 10 RTK as default
    }
  }

  // Appeal finalization method - the core function for processing appeal decisions
  async finalisasiBanding(laporanId: number, userMenang: boolean): Promise<ethers.ContractTransactionResponse> {
    console.log('=== FINALISASI BANDING ===');
    console.log(`Report ID: ${laporanId}, User Wins: ${userMenang}`);
    
    try {
      // Basic validation checks
      const signerAddress = await this.signer.getAddress();
      console.log(`👤 Admin: ${signerAddress}`);
      
      // Get report data
      const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.provider);
      const reportData = await userContract.laporan(laporanId);
      const institusiId = reportData.institusiId;
      
      console.log(`📋 Report ${laporanId} - Institution: ${institusiId}, Status: ${reportData.status}`);
      
      // Verify admin authorization
      const institusiContract = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.provider);
      const [nama, admin, treasury] = await institusiContract.getInstitusiData(institusiId);
      
      if (signerAddress.toLowerCase() !== admin.toLowerCase()) {
        throw new Error(`Unauthorized: You are not the admin of institution "${nama}". Admin: ${admin}`);
      }
      
      console.log(`✅ Admin authorization confirmed for institution "${nama}"`);
      
      // Check if report is in appeal status
      const isBandingStatus = await userContract.isBanding(laporanId);
      if (!isBandingStatus || reportData.status !== 'Banding') {
        throw new Error(`Report ${laporanId} is not in appeal status. Current status: ${reportData.status}`);
      }
      
      console.log(`✅ Report is in appeal status, proceeding with finalization...`);
      
      // Call adminFinalisasiBanding on Institusi contract
      // This is the correct entry point for admins according to the smart contract design

      const institusiContractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.institusi, INSTITUSI_ABI, this.signer);
      
      console.log(`🚀 Calling adminFinalisasiBanding(${laporanId}, ${userMenang}) on Institusi contract...`);
      
      // Execute the transaction
      return this.executeTransaction(
        () => institusiContractWithSigner.adminFinalisasiBanding(laporanId, userMenang),
        'adminFinalisasiBanding'
      );
      
    } catch (error: any) {
      console.error('Error in finalisasiBanding:', error);
      
      // Provide clear error messages
      if (error.message.includes('Unauthorized')) {
        throw error; // Re-throw authorization errors as-is
      } else if (error.message.includes('Hanya admin')) {
        throw new Error('Smart contract authorization error: The contract rejected your admin credentials. This may be a smart contract bug.');
      } else if (error.message.includes('not in appeal status')) {
        throw error; // Re-throw status errors as-is
      } else if (error.message.includes('missing revert data')) {
        throw new Error('Function not found: The adminFinalisasiBanding function may not exist in the deployed contract.');
      } else {
        throw new Error(`Appeal finalization failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Method to fix User contract setup for appeals
  async fixUserContractForAppeals(): Promise<void> {
    console.log('=== FIXING USER CONTRACT FOR APPEALS ===');
    
    try {
      const userContract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
      
      // Check current contract references
      console.log('Checking current User contract setup...');
      const currentInstitusi = await userContract.institusiContract();
      const currentRewardManager = await userContract.rewardManager();
      const currentValidator = await userContract.validatorContract();
      const currentRtkToken = await userContract.rtkToken();
      
      console.log('Current User contract references:', {
        institusi: currentInstitusi,
        rewardManager: currentRewardManager,
        validator: currentValidator,
        rtkToken: currentRtkToken
      });
      
      // Check if references are correct
      const needsUpdate = 
        currentInstitusi.toLowerCase() !== CONTRACT_ADDRESSES.institusi.toLowerCase() ||
        currentRewardManager.toLowerCase() !== CONTRACT_ADDRESSES.rewardManager.toLowerCase() ||
        currentValidator.toLowerCase() !== CONTRACT_ADDRESSES.validator.toLowerCase() ||
        currentRtkToken.toLowerCase() !== CONTRACT_ADDRESSES.rtkToken.toLowerCase();
      
      if (needsUpdate) {
        console.log('User contract references need updating...');
        
        const tx = await userContract.setContracts(
          CONTRACT_ADDRESSES.institusi,
          CONTRACT_ADDRESSES.rewardManager,
          CONTRACT_ADDRESSES.validator,
          CONTRACT_ADDRESSES.rtkToken
        );
        
        console.log('User contract update transaction:', tx.hash);
        await tx.wait();
        console.log('✅ User contract references updated successfully');
      } else {
        console.log('✅ User contract references are already correct');
      }
      
    } catch (error: any) {
      console.error('Error fixing User contract for appeals:', error);
      throw error;
    }
  }
}
