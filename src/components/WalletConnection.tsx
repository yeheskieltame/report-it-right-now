
import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const WalletConnection: React.FC = () => {
  const { address, isConnected, role, connectWallet, disconnectWallet } = useWallet();
  const { t } = useLanguage();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return t('role.superAdmin');
      case 'admin': return t('role.admin');
      case 'validator': return t('role.validator');
      case 'pelapor': return t('role.reporter');
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500 hover:bg-purple-600';
      case 'admin': return 'bg-blue-500 hover:bg-blue-600';
      case 'validator': return 'bg-green-500 hover:bg-green-600';
      case 'pelapor': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-1 text-center">
          <Button 
            onClick={connectWallet}
            className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3"
          >
            {t('wallet.connect')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center space-x-4 bg-card border rounded-lg px-4 py-2">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">{t('wallet.connected')}</span>
      </div>
      
      <Badge className={`${getRoleBadgeColor(role)} text-white`}>
        {getRoleDisplayName(role)}
      </Badge>
      
      <span className="text-sm text-muted-foreground font-mono">
        {formatAddress(address!)}
      </span>
      
      <Button 
        onClick={disconnectWallet}
        variant="outline" 
        size="sm"
        className="text-xs"
      >
        {t('wallet.disconnect')}
      </Button>
    </div>
  );
};

export default WalletConnection;
