
export interface Report {
  laporanId: string;
  judul: string;
  deskripsi: string;
  status: 'Menunggu' | 'Valid' | 'Tidak Valid' | 'Banding';
  assignedValidator?: string;
  pelapor: string;
  institusiId: string;
  hasilValidasi?: string;
  contributionLevel?: number;
}

export interface Validator {
  address: string;
  reputation: number;
  stakedAmount: number;
  isActive: boolean;
}

export interface Institution {
  institusiId: string;
  name: string;
  adminAddress: string;
  validators: Validator[];
  pelapors: string[];
}

export interface ContractAddresses {
  institusi: string;
  user: string;
  validator: string;
  rewardManager: string;
  rtkToken: string;
}

export type UserRole = 'owner' | 'admin' | 'validator' | 'pelapor' | 'unknown';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  role: UserRole;
  signer: any;
  provider: any;
}
