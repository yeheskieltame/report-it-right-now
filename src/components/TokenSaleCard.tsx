import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, ShoppingCart, TrendingUp, Wallet, ArrowRight, DollarSign, Info } from 'lucide-react';

interface TokenSaleCardProps {
  onPurchaseSuccess?: () => void;
}

interface TokenSaleInfo {
  tokenPrice: string;
  availableTokens: string;
  userETHBalance: string;
  userRTKBalance: string;
}

const TokenSaleCard: React.FC<TokenSaleCardProps> = ({ onPurchaseSuccess }) => {
  const { isConnected, contractService, address, provider } = useWallet();
  const { t } = useLanguage();
  const [tokenSaleInfo, setTokenSaleInfo] = useState<TokenSaleInfo>({
    tokenPrice: '0',
    availableTokens: '0',
    userETHBalance: '0',
    userRTKBalance: '0'
  });
  const [ethAmount, setEthAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isConnected && contractService) {
      loadTokenSaleData();
    }
  }, [isConnected, contractService]);

  useEffect(() => {
    if (ethAmount && contractService && parseFloat(ethAmount) > 0) {
      calculateEstimatedTokens();
    } else {
      setEstimatedTokens('0');
    }
  }, [ethAmount, contractService]);

  const loadTokenSaleData = async () => {
    if (!contractService || !address || !provider) return;
    
    setLoading(true);
    setError('');
    
    try {
      const [tokenPrice, availableTokens, userRTKBalance] = await Promise.all([
        contractService.getTokenPrice(),
        contractService.getTokenSaleRTKBalance(),
        contractService.getRTKBalance(address)
      ]);

      // Get ETH balance
      const ethBalance = await provider.getBalance(address);
      const userETHBalance = ethers.formatEther(ethBalance);

      setTokenSaleInfo({
        tokenPrice,
        availableTokens,
        userETHBalance,
        userRTKBalance
      });
    } catch (error: any) {
      console.error('Error loading token sale data:', error);
      if (error.message.includes('TokenSale contract address not set')) {
        setError(t('tokenSale.error'));
      } else {
        setError(t('tokenSale.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedTokens = async () => {
    if (!contractService || !ethAmount) return;
    
    try {
      const tokens = await contractService.calculateTokensForETH(ethAmount);
      setEstimatedTokens(tokens);
    } catch (error) {
      console.error('Error calculating tokens:', error);
      setEstimatedTokens('0');
    }
  };

  const handlePurchase = async () => {
    if (!contractService || !ethAmount) return;
    
    if (parseFloat(ethAmount) <= 0) {
      setError('Masukkan jumlah ETH yang valid');
      return;
    }

    if (parseFloat(ethAmount) > parseFloat(tokenSaleInfo.userETHBalance)) {
      setError('Saldo ETH tidak mencukupi');
      return;
    }

    if (parseFloat(estimatedTokens) > parseFloat(tokenSaleInfo.availableTokens)) {
      setError('Token yang tersedia tidak mencukupi');
      return;
    }

    setPurchasing(true);
    setError('');
    setSuccess('');

    try {
      const tx = await contractService.buyTokensWithETH(ethAmount);
      setSuccess(`Transaksi berhasil! Hash: ${tx.hash}`);
      
      // Wait for transaction confirmation
      await tx.wait();
      setSuccess('Token berhasil dibeli! Saldo Anda akan diperbarui.');
      
      // Refresh data
      await loadTokenSaleData();
      setEthAmount('');
      setEstimatedTokens('0');
      
      // Call parent refresh function if provided
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }
    } catch (error: any) {
      console.error('Error purchasing tokens:', error);
      setError(error.message || 'Gagal membeli token');
    } finally {
      setPurchasing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-orange-200" />
          <h3 className="text-xl font-semibold mb-2">{t('wallet.connect')}</h3>
          <p className="text-orange-100">{t('tokenSale.description')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <div className="bg-white/20 rounded-full p-2">
            <ShoppingCart className="w-6 h-6" />
          </div>
          {t('tokenSale.title')}
          <Badge className="bg-white/20 text-white ml-auto">
            <TrendingUp className="w-4 h-4 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {/* Token Sale Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm text-white/80">{t('tokenSale.currentPrice')}</span>
                </div>
                <p className="text-xl font-bold">{parseFloat(tokenSaleInfo.tokenPrice).toFixed(6)} ETH</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm text-white/80">{t('tokenSale.yourBalance').replace('RTK ', '')}</span>
                </div>
                <p className="text-xl font-bold">{parseFloat(tokenSaleInfo.availableTokens).toFixed(2)} RTK</p>
              </div>
            </div>

            {/* User Balances */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {t('wallet.balance')}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/80">ETH Balance:</span>
                  <p className="font-mono text-lg">{parseFloat(tokenSaleInfo.userETHBalance).toFixed(4)} ETH</p>
                </div>
                <div>
                  <span className="text-white/80">RTK Balance:</span>
                  <p className="font-mono text-lg">{parseFloat(tokenSaleInfo.userRTKBalance).toFixed(2)} RTK</p>
                </div>
              </div>
            </div>

            {/* Purchase Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h4 className="font-semibold mb-4">{t('tokenSale.title')}</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-2">
                    {t('tokenSale.ethAmount')}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    placeholder="0.1"
                    className="bg-white/20 border-white/30 text-white placeholder-white/50"
                    disabled={purchasing}
                  />
                </div>

                {parseFloat(estimatedTokens) > 0 && (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <span className="text-white/80">{t('tokenSale.estimatedTokens')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{parseFloat(estimatedTokens).toFixed(2)}</span>
                      <span className="text-white/80">RTK</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handlePurchase}
                  disabled={!ethAmount || parseFloat(ethAmount) <= 0 || purchasing}
                  className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold py-3"
                >
                  {purchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      {t('tokenSale.buying')}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('tokenSale.buyTokens')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert className="bg-red-500/20 border-red-400 text-white">
                <Info className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/20 border-green-400 text-white">
                <Info className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Info Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-sm">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {t('tokenSale.info.title')}
              </h5>
              <ul className="space-y-1 text-white/80">
                <li>{t('tokenSale.info.point1')}</li>
                <li>{t('tokenSale.info.point2')}</li>
                <li>{t('tokenSale.info.point3')}</li>
                <li>{t('tokenSale.info.point4')}</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenSaleCard;
