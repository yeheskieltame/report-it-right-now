
import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import WalletConnection from './WalletConnection';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected } = useWallet();
  const { t } = useLanguage();
  
  const handleGoHome = () => {
    localStorage.removeItem('selectedInstitution');
    localStorage.removeItem('selectedRole');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DR</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  {t('nav.home')}
                </Button>
              )}
              <LanguageSwitcher />
              <WalletConnection />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
