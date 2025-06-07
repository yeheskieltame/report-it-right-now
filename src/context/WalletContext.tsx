import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletState, UserRole, ContractAddresses } from '../types';
import { CONTRACT_ADDRESSES, TARANIUM_NETWORK } from '../config/contracts';
import { ContractService } from '../services/ContractService';

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  contracts: ContractAddresses;
  updateContracts: (contracts: ContractAddresses) => void;
  checkUserRole: (address: string) => Promise<UserRole>;
  contractService: ContractService | null;
  switchToTaranium: () => Promise<void>;
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
    institusi: CONTRACT_ADDRESSES.institusi,
    user: CONTRACT_ADDRESSES.user,
    validator: CONTRACT_ADDRESSES.validator,
    rewardManager: CONTRACT_ADDRESSES.rewardManager,
    rtkToken: CONTRACT_ADDRESSES.rtkToken,
  });

  const [contractService, setContractService] = useState<ContractService | null>(null);

  const switchToTaranium = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARANIUM_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [TARANIUM_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding Taranium network:', addError);
        }
      } else {
        console.error('Error switching to Taranium:', switchError);
      }
    }
  };

  const checkUserRole = async (address: string): Promise<UserRole> => {
    if (!contractService) return 'pelapor';
    
    try {
      // Check if owner
      if (address.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
        return 'owner';
      }

      // Check if admin of any institution
      const institusiCount = await contractService.getInstitusiCount();
      for (let i = 1; i <= institusiCount; i++) {
        try {
          const [, admin] = await contractService.getInstitusiData(i);
          if (admin.toLowerCase() === address.toLowerCase()) {
            return 'admin';
          }
        } catch (error) {
          console.log(`Institution ${i} not found or error:`, error);
          continue;
        }
      }

      // Check if validator in any institution
      for (let i = 1; i <= institusiCount; i++) {
        try {
          const isValidator = await contractService.isValidator(i, address);
          if (isValidator) {
            return 'validator';
          }
        } catch (error) {
          console.log(`Error checking validator status for institution ${i}:`, error);
          continue;
        }
      }

      // Default to pelapor
      return 'pelapor';
    } catch (error) {
      console.error('Error checking user role:', error);
      return 'pelapor';
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check and switch to Taranium network
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== 9924) {
          await switchToTaranium();
        }
        
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const contractServiceInstance = new ContractService(provider, signer);
        setContractService(contractServiceInstance);
        
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
    setContractService(null);
    
    // Clear localStorage
    localStorage.removeItem('selectedInstitution');
    localStorage.removeItem('selectedRole');
  };

  const updateContracts = (newContracts: ContractAddresses) => {
    setContracts(newContracts);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            const contractServiceInstance = new ContractService(provider, signer);
            setContractService(contractServiceInstance);
            
            const role = await checkUserRole(address);
            
            setWalletState({
              address,
              isConnected: true,
              role,
              signer,
              provider,
            });
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Store event handlers to properly remove them later
    let accountsChangedHandler: (accounts: string[]) => void;
    let chainChangedHandler: () => void;

    // Listen for account changes
    if (window.ethereum) {
      accountsChangedHandler = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          // Reconnect with new account
          connectWallet();
        }
      };

      chainChangedHandler = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', accountsChangedHandler);
      window.ethereum.on('chainChanged', chainChangedHandler);
    }

    return () => {
      if (window.ethereum && accountsChangedHandler && chainChangedHandler) {
        window.ethereum.removeListener('accountsChanged', accountsChangedHandler);
        window.ethereum.removeListener('chainChanged', chainChangedHandler);
      }
    };
  }, []);

  return (
    <WalletContext.Provider value={{
      ...walletState,
      connectWallet,
      disconnectWallet,
      contracts,
      updateContracts,
      checkUserRole,
      contractService,
      switchToTaranium,
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
