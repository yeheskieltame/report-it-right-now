
import { ethers } from 'ethers';

// Contract ABIs - These would be imported from the actual compiled contracts
export const INSTITUSI_ABI = [
  "function tambahValidator(address _validator) external",
  "function tambahPelapor(address _pelapor) external",
  "function validatorList(uint256) external view returns (address)",
  "function validatorReputation(address) external view returns (uint256)",
  "function setValidatorContribution(uint256 _laporanId, uint8 _level) external",
  "function finalisasiBanding(uint256 _laporanId, bool _userMenang) external"
];

export const USER_ABI = [
  "function buatLaporan(string memory _institusiId, string memory _judul, string memory _deskripsi) external",
  "function ajukanBanding(uint256 _laporanId) external",
  "function getLaporan(uint256 _laporanId) external view returns (tuple)"
];

export const VALIDATOR_ABI = [
  "function validasiLaporan(uint256 _laporanId, bool _isValid, string memory _deskripsi) external",
  "function resignFromInstitusi(string memory _institusiId) external"
];

export const REWARD_MANAGER_ABI = [
  "function depositRTK(uint256 _amount) external",
  "function stake(uint256 _amount) external",
  "function unstake(uint256 _amount) external",
  "function claimReward(uint256 _laporanId) external",
  "function getStakedAmount(address _validator) external view returns (uint256)"
];

export const RTK_TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

export class ContractService {
  private signer: any;
  private contracts: any;

  constructor(signer: any, contractAddresses: any) {
    this.signer = signer;
    this.contracts = {
      institusi: new ethers.Contract(contractAddresses.institusi, INSTITUSI_ABI, signer),
      user: new ethers.Contract(contractAddresses.user, USER_ABI, signer),
      validator: new ethers.Contract(contractAddresses.validator, VALIDATOR_ABI, signer),
      rewardManager: new ethers.Contract(contractAddresses.rewardManager, REWARD_MANAGER_ABI, signer),
      rtkToken: new ethers.Contract(contractAddresses.rtkToken, RTK_TOKEN_ABI, signer)
    };
  }

  // Institution Contract Methods
  async addValidator(validatorAddress: string) {
    return await this.contracts.institusi.tambahValidator(validatorAddress);
  }

  async addReporter(reporterAddress: string) {
    return await this.contracts.institusi.tambahPelapor(reporterAddress);
  }

  async getValidatorReputation(validatorAddress: string) {
    return await this.contracts.institusi.validatorReputation(validatorAddress);
  }

  async setValidatorContribution(reportId: number, level: number) {
    return await this.contracts.institusi.setValidatorContribution(reportId, level);
  }

  async finalizeAppeal(reportId: number, userWins: boolean) {
    return await this.contracts.institusi.finalisasiBanding(reportId, userWins);
  }

  // User Contract Methods
  async createReport(institutionId: string, title: string, description: string) {
    return await this.contracts.user.buatLaporan(institutionId, title, description);
  }

  async submitAppeal(reportId: number) {
    return await this.contracts.user.ajukanBanding(reportId);
  }

  async getReport(reportId: number) {
    return await this.contracts.user.getLaporan(reportId);
  }

  // Validator Contract Methods
  async validateReport(reportId: number, isValid: boolean, description: string) {
    return await this.contracts.validator.validasiLaporan(reportId, isValid, description);
  }

  async resignFromInstitution(institutionId: string) {
    return await this.contracts.validator.resignFromInstitusi(institutionId);
  }

  // Reward Manager Methods
  async depositRTK(amount: string) {
    return await this.contracts.rewardManager.depositRTK(ethers.parseEther(amount));
  }

  async stake(amount: string) {
    return await this.contracts.rewardManager.stake(ethers.parseEther(amount));
  }

  async unstake(amount: string) {
    return await this.contracts.rewardManager.unstake(ethers.parseEther(amount));
  }

  async claimReward(reportId: number) {
    return await this.contracts.rewardManager.claimReward(reportId);
  }

  async getStakedAmount(validatorAddress: string) {
    const amount = await this.contracts.rewardManager.getStakedAmount(validatorAddress);
    return ethers.formatEther(amount);
  }

  // Token Methods
  async approveToken(spenderAddress: string, amount: string) {
    return await this.contracts.rtkToken.approve(spenderAddress, ethers.parseEther(amount));
  }

  async getTokenBalance(address: string) {
    const balance = await this.contracts.rtkToken.balanceOf(address);
    return ethers.formatEther(balance);
  }
}
