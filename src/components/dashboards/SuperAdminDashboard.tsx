
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '../../context/WalletContext';
import { Settings, Coins, Building2 } from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
  const { contracts, updateContracts } = useWallet();
  const [contractInputs, setContractInputs] = useState(contracts);
  const [rewardAmount, setRewardAmount] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);

  const handleContractUpdate = () => {
    updateContracts(contractInputs);
    // TODO: Call setContracts function on smart contracts
    console.log('Updating contracts:', contractInputs);
  };

  const handleRewardDeposit = () => {
    // TODO: Call depositRTK function
    console.log('Depositing reward:', rewardAmount);
  };

  const contractStatus = (address: string) => {
    return address ? 'Connected' : 'Not Connected';
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
                <p className="text-sm text-muted-foreground mb-2">Current Reward Pool Balance</p>
                <p className="text-2xl font-bold text-green-600">1,000,000 RTK</p>
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
              >
                Deposit to Reward Pool
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
