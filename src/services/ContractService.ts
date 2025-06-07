
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

  // RTK Token Contract Methods
  async getRTKBalance(address: string): Promise<string> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async approveRTK(spender: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rtkToken, RTKT_TOKEN_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    return await contract.approve(spender, amountWei);
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
    return await contract.stake(amountWei);
  }

  async unstake(amount: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.rewardManager, REWARD_MANAGER_ABI, this.signer);
    const amountWei = ethers.parseEther(amount);
    return await contract.unstake(amountWei);
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

  // User Contract Methods
  async buatLaporan(institusiId: number, judul: string, deskripsi: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
    return await contract.buatLaporan(institusiId, judul, deskripsi);
  }

  async ajukanBanding(laporanId: number): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
    return await contract.ajukanBanding(laporanId);
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
    return await contract.validasiLaporan(laporanId, isValid, deskripsi);
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
}
