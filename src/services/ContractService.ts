
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

  // Institusi Contract Methods
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

  // User Contract Methods
  async buatLaporan(institusiId: number, judul: string, deskripsi: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.user, USER_ABI, this.signer);
    return await contract.buatLaporan(institusiId, judul, deskripsi);
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

  // Validator Contract Methods
  async validasiLaporan(laporanId: number, isValid: boolean, deskripsi: string): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.signer);
    return await contract.validasiLaporan(laporanId, isValid, deskripsi);
  }

  async resignFromInstitusi(institusiId: number): Promise<ethers.ContractTransactionResponse> {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.validator, VALIDATOR_ABI, this.signer);
    return await contract.resignFromInstitusi(institusiId);
  }
}
