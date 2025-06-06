
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletState, UserRole, ContractAddresses } from '../types';

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  contracts: ContractAddresses;
  updateContracts: (contracts: ContractAddresses) => void;
  checkUserRole: (address: string) => Promise<UserRole>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const OWNER_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual owner address

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    role: 'unknown',
    signer: null,
    provider: null,
  });

  const [contracts, setContracts] = useState<ContractAddresses>({
    institusi: '',
    user: '',
    validator: '',
    rewardManager: '',
    rtkToken: '',
  });

  const checkUserRole = async (address: string): Promise<UserRole> => {
    // Owner check
    if (address.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
      return 'owner';
    }

    // TODO: Implement contract calls to check roles
    // This would involve calling the smart contracts to determine user role
    // For now, returning 'pelapor' as default
    return 'pelapor';
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const role = await checkUserRole(address);

        setWalletState({
          address,
          isConnected: true,
          role,
          signer,
          provider,
        });
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      address: null,
      isConnected: false,
      role: 'unknown',
      signer: null,
      provider: null,
    });
  };

  const updateContracts = (newContracts: ContractAddresses) => {
    setContracts(newContracts);
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const role = await checkUserRole(address);
          
          setWalletState({
            address,
            isConnected: true,
            role,
            signer,
            provider,
          });
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <WalletContext.Provider value={{
      ...walletState,
      connectWallet,
      disconnectWallet,
      contracts,
      updateContracts,
      checkUserRole,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
