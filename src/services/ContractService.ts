
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
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    return await contract.setContributionLevel(laporanId, level);
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

  // User Contract Methods - Enhanced buatLaporan with detailed validation
  async buatLaporan(institusiId: number, judul: string, deskripsi: string): Promise<ethers.ContractTransactionResponse> {
    console.log('=== STARTING buatLaporan PROCESS ===');
    console.log('Input parameters:', { institusiId, judul, deskripsi });
    console.log('Parameter types:', { 
      institusiId: typeof institusiId, 
      judul: typeof judul, 
      deskripsi: typeof deskripsi 
    });
    
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
      
      // Log contract details
      console.log('Contract address:', CONTRACT_ADDRESSES.user);
      console.log('Contract interface functions:', Object.keys(contract.interface.functions));
      
      // Check if buatLaporan function exists in contract
      if (!contract.interface.functions['buatLaporan(uint256,string,string)']) {
        console.error('Available functions:', Object.keys(contract.interface.functions));
        throw new Error('buatLaporan function not found in contract ABI');
      }
      
      // Try to estimate gas with detailed logging
      console.log('Attempting gas estimation...');
      try {
        const gasEstimate = await contract.buatLaporan.estimateGas(institusiId, cleanJudul, cleanDeskripsi);
        console.log('Gas estimation successful:', gasEstimate.toString());
      } catch (gasError: any) {
        console.error('=== GAS ESTIMATION FAILED ===');
        console.error('Gas error details:', gasError);
        console.error('Gas error message:', gasError.message);
        console.error('Gas error reason:', gasError.reason);
        console.error('Gas error code:', gasError.code);
        
        // Try to get more specific error information
        if (gasError.data) {
          console.error('Gas error data:', gasError.data);
        }
        
        throw new Error(`Gas estimation failed: ${gasError.reason || gasError.message || 'Unknown error during gas estimation'}`);
      }
      
      console.log('Submitting transaction...');
      const tx = await contract.buatLaporan(institusiId, cleanJudul, cleanDeskripsi);
      console.log('Transaction submitted successfully:', tx.hash);
      
      return tx;
      
    } catch (error: any) {
      console.error('=== ERROR IN buatLaporan ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Re-throw with more context
      if (error.message.includes('Gas estimation failed')) {
        throw error; // Already has good context
      } else if (error.reason) {
        throw new Error(`Failed to create report: ${error.reason}`);
      } else if (error.code === 'CALL_EXCEPTION') {
        throw new Error(`Contract call failed: Please check if you are registered as a reporter for this institution and try again`);
      } else {
        throw new Error(`Failed to create report: ${error.message || 'Unknown error'}`);
      }
    }
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
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.provider);
    return await contract.hasilValidasi(laporanId);
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
      
      console.log('All contracts initialized successfully');
    } catch (error) {
      console.error('Error initializing contracts:', error);
      throw error;
    }
  }
}
