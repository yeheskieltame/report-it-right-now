
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { Settings, Coins, Building2 } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../../config/contracts';

const SuperAdminDashboard: React.FC = () => {
  const { contracts, updateContracts, contractService } = useWallet();
  const { toast } = useToast();
  const [contractInputs, setContractInputs] = useState(contracts);
  const [rewardAmount, setRewardAmount] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rtkBalance, setRtkBalance] = useState('0');

  useEffect(() => {
    loadSystemData();
  }, [contractService]);

  const loadSystemData = async () => {
    if (!contractService) return;

    try {
      // Load institutions
      const count = await contractService.getInstitusiCount();
      const institutionsList = [];
      
      for (let i = 1; i <= count; i++) {
        try {
          const [nama, admin, treasury] = await contractService.getInstitusiData(i);
          institutionsList.push({
            institusiId: i.toString(),
            name: nama,
            adminAddress: admin,
            treasury: treasury
          });
        } catch (error) {
          console.log(`Institution ${i} not found`);
        }
      }
      
      setInstitutions(institutionsList);

      // Load RTK balance if address is available
      const address = await contractService['signer'].getAddress();
      const balance = await contractService.getRTKBalance(address);
      setRtkBalance(balance);
    } catch (error) {
      console.error('Error loading system data:', error);
    }
  };

  const handleContractUpdate = () => {
    updateContracts(contractInputs);
    toast({
      title: "Success",
      description: "Contract addresses updated successfully!"
    });
  };

  const handleRewardDeposit = async () => {
    if (!contractService || !rewardAmount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First approve tokens
      const approveTx = await contractService.approveRTK(
        CONTRACT_ADDRESSES.rewardManager,
        rewardAmount
      );
      
      toast({
        title: "Approval Submitted",
        description: "Approving tokens for deposit..."
      });

      await approveTx.wait();

      // Then deposit
      const depositTx = await contractService.depositRTK(rewardAmount);
      
      toast({
        title: "Deposit Submitted",
        description: "Depositing tokens to reward pool..."
      });

      await depositTx.wait();
      
      toast({
        title: "Success",
        description: "Tokens deposited to reward pool successfully!"
      });

      setRewardAmount('');
      loadSystemData();
    } catch (error) {
      console.error('Error depositing reward:', error);
      toast({
        title: "Error",
        description: "Failed to deposit reward",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (address: string) => {
    return address ? (
      <Badge className="bg-green-500 text-white">Connected</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">Not Connected</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-purple-600" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Super Admin Dashboard
        </h2>
      </div>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contracts">Contract Setup</TabsTrigger>
          <TabsTrigger value="rewards">Reward Pool</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Smart Contract Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institusi">Institusi Contract</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="institusi"
                      placeholder="0x..."
                      value={contractInputs.institusi}
                      onChange={(e) => setContractInputs({...contractInputs, institusi: e.target.value})}
                    />
                    {getStatusBadge(contractInputs.institusi)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user">User Contract</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="user"
                      placeholder="0x..."
                      value={contractInputs.user}
                      onChange={(e) => setContractInputs({...contractInputs, user: e.target.value})}
                    />
                    {getStatusBadge(contractInputs.user)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validator">Validator Contract</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="validator"
                      placeholder="0x..."
                      value={contractInputs.validator}
                      onChange={(e) => setContractInputs({...contractInputs, validator: e.target.value})}
                    />
                    {getStatusBadge(contractInputs.validator)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rewardManager">Reward Manager Contract</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="rewardManager"
                      placeholder="0x..."
                      value={contractInputs.rewardManager}
                      onChange={(e) => setContractInputs({...contractInputs, rewardManager: e.target.value})}
                    />
                    {getStatusBadge(contractInputs.rewardManager)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rtkToken">RTK Token Contract</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="rtkToken"
                      placeholder="0x..."
                      value={contractInputs.rtkToken}
                      onChange={(e) => setContractInputs({...contractInputs, rtkToken: e.target.value})}
                    />
                    {getStatusBadge(contractInputs.rtkToken)}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleContractUpdate}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Update Contract Addresses
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="w-5 h-5" />
                <span>Reward Pool Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Your RTK Balance</p>
                <p className="text-2xl font-bold text-green-600">{parseFloat(rtkBalance).toFixed(2)} RTK</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward-amount">Deposit Amount (RTK)</Label>
                <Input
                  id="reward-amount"
                  placeholder="Enter amount to deposit"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleRewardDeposit}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                disabled={loading || !rewardAmount}
              >
                {loading ? 'Processing...' : 'Deposit to Reward Pool'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Registered Institutions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {institutions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No institutions registered yet</p>
                ) : (
                  institutions.map((institution, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{institution.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {institution.institusiId}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{institution.adminAddress}</p>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;
