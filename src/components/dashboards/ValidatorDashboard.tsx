
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Coins, Trophy, Settings } from 'lucide-react';

const ValidatorDashboard: React.FC = () => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [validationResults, setValidationResults] = useState<{[key: string]: {isValid: boolean, description: string}}>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);

  const handleValidation = (reportId: string) => {
    const result = validationResults[reportId];
    if (result) {
      console.log('Submitting validation:', reportId, result);
    }
  };

  const handleStake = () => {
    console.log('Staking amount:', stakeAmount);
  };

  const handleUnstake = () => {
    console.log('Unstaking amount:', unstakeAmount);
  };

  const handleClaimReward = (reportId: string) => {
    console.log('Claiming reward for:', reportId);
  };

  const updateValidationResult = (reportId: string, field: 'isValid' | 'description', value: any) => {
    setValidationResults(prev => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-green-600" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Validator Dashboard
        </h2>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="staking">Staking & Rewards</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Assigned Validation Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tasks assigned</p>
                    <p className="text-sm text-muted-foreground mt-2">New tasks will appear here when assigned</p>
                  </div>
                ) : (
                  tasks.map((task, index) => (
                    <div key={index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">Report ID: {task.reportId}</p>
                        </div>
                        <Badge>Pending Validation</Badge>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm">{task.description}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`valid-${task.reportId}`}
                            checked={validationResults[task.reportId]?.isValid || false}
                            onCheckedChange={(checked) => updateValidationResult(task.reportId, 'isValid', checked)}
                          />
                          <Label htmlFor={`valid-${task.reportId}`}>Mark as Valid</Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`desc-${task.reportId}`}>Validation Description</Label>
                          <Textarea
                            id={`desc-${task.reportId}`}
                            placeholder="Enter your validation notes..."
                            value={validationResults[task.reportId]?.description || ''}
                            onChange={(e) => updateValidationResult(task.reportId, 'description', e.target.value)}
                          />
                        </div>

                        <Button 
                          onClick={() => handleValidation(task.reportId)}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500"
                        >
                          Submit Validation
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staking" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Staked Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">1,500 RTK</p>
                <p className="text-sm text-muted-foreground">Currently staked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Available Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">250 RTK</p>
                <p className="text-sm text-muted-foreground">Ready to claim</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Reputation Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">85</p>
                <p className="text-sm text-muted-foreground">Out of 100</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>Stake Tokens</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stake-amount">Amount to Stake (RTK)</Label>
                  <Input
                    id="stake-amount"
                    placeholder="Enter amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Approve
                  </Button>
                  <Button 
                    onClick={handleStake}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-green-500"
                  >
                    Stake
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>Unstake Tokens</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unstake-amount">Amount to Unstake (RTK)</Label>
                  <Input
                    id="unstake-amount"
                    placeholder="Enter amount"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleUnstake}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                >
                  Unstake
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Claimable Rewards</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No rewards to claim</p>
                ) : (
                  rewards.map((reward, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Report #{reward.reportId}</p>
                        <p className="text-sm text-muted-foreground">Contribution Level: {reward.level}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-bold text-green-600">{reward.amount} RTK</span>
                        <Button 
                          onClick={() => handleClaimReward(reward.reportId)}
                          size="sm"
                        >
                          Claim
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Validator Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Validations</Label>
                  <p className="text-2xl font-bold">42</p>
                </div>
                <div className="space-y-2">
                  <Label>Success Rate</Label>
                  <p className="text-2xl font-bold text-green-600">96%</p>
                </div>
                <div className="space-y-2">
                  <Label>Total Earned</Label>
                  <p className="text-2xl font-bold text-blue-600">1,250 RTK</p>
                </div>
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <p className="text-lg">January 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Validator Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution-id">Resign from Institution</Label>
                <div className="flex space-x-2">
                  <Input
                    id="institution-id"
                    placeholder="Institution ID"
                  />
                  <Button variant="destructive">
                    Resign
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Warning: You can only resign if you have no active tasks
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValidatorDashboard;
