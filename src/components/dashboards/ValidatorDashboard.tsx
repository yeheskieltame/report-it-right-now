import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Coins, Trophy, Settings, AlertCircle, CheckCircle, Scale, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '@/hooks/use-toast';

const ValidatorDashboard: React.FC = () => {
  const { contractService, address } = useWallet();
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [validationResults, setValidationResults] = useState<{[key: string]: {isValid: boolean, description: string}}>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [stakedAmount, setStakedAmount] = useState('0');
  const [rtkBalance, setRtkBalance] = useState('0');
  const [minStakeAmount, setMinStakeAmount] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [stakingStep, setStakingStep] = useState<'approve' | 'stake' | 'complete'>('approve');
  const [appealedReports, setAppealedReports] = useState<any[]>([]);

  useEffect(() => {
    if (address && contractService) {
      loadValidatorData();
      loadTasks();
      loadAppealedReports();
    }
  }, [contractService, address]);

  const loadValidatorData = async () => {
    if (!contractService || !address) return;

    try {
      const [staked, balance, minStake, currentAllowance] = await Promise.all([
        contractService.getStakedAmount(address),
        contractService.getRTKBalance(address),
        contractService.getMinStakeAmount(),
        contractService.getAllowance(address, contractService['CONTRACT_ADDRESSES']?.rewardManager || '0x641D0Bf2936E2183443c60513b1094Ff5E39D42F')
      ]);

      setStakedAmount(staked);
      setRtkBalance(balance);
      setMinStakeAmount(minStake);
      setAllowance(currentAllowance);

      console.log('Validator data loaded:', {
        staked,
        balance,
        minStake,
        allowance: currentAllowance
      });
    } catch (error) {
      console.error('Error loading validator data:', error);
    }
  };

  const loadTasks = async () => {
    if (!contractService || !address) return;

    try {
      const totalReports = await contractService.getLaporanCount();
      const validatorTasks = [];

      for (let i = 1; i <= totalReports; i++) {
        try {
          const laporan = await contractService.getLaporan(i);
          if (laporan.assignedValidator.toLowerCase() === address.toLowerCase() && 
              laporan.status === 'Menunggu') {
            validatorTasks.push({
              reportId: laporan.laporanId.toString(),
              title: laporan.judul,
              description: laporan.deskripsi,
              pelapor: laporan.pelapor
            });
          }
        } catch (error) {
          console.log(`Report ${i} not found or error`);
        }
      }

      setTasks(validatorTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadAppealedReports = async () => {
    if (!contractService || !address) return;
    
    try {
      const totalReports = await contractService.getLaporanCount();
      const appealed: any[] = [];
      
      for (let i = 1; i <= totalReports; i++) {
        try {
          const laporan = await contractService.getLaporan(i);
          const isBanding = await contractService.isBanding(i);
          
          // Check if this validator was assigned to this report and it's now appealed
          if (laporan.assignedValidator?.toLowerCase() === address.toLowerCase() && isBanding) {
            appealed.push({
              reportId: i,
              title: laporan.judul,
              description: laporan.deskripsi,
              pelapor: laporan.pelapor,
              status: laporan.status,
              timestamp: Number(laporan.creationTimestamp)
            });
          }
        } catch (error) {
          console.log(`Error loading report ${i}:`, error);
        }
      }
      
      setAppealedReports(appealed);
    } catch (error) {
      console.error('Error loading appealed reports:', error);
    }
  };

  const handleValidation = async (reportId: string) => {
    const result = validationResults[reportId];
    if (!result || !contractService) return;

    setLoading(true);
    try {
      console.log('Submitting validation:', {
        reportId: parseInt(reportId),
        isValid: result.isValid,
        description: result.description
      });

      const tx = await contractService.validasiLaporan(
        parseInt(reportId),
        result.isValid,
        result.description
      );
      
      toast({
        title: "Validation Submitted",
        description: `Transaction hash: ${tx.hash}. Your validation is being processed...`
      });

      await tx.wait();
      
      toast({
        title: "Success",
        description: "Validation submitted successfully!"
      });

      loadTasks();
    } catch (error: any) {
      console.error('Error submitting validation:', error);
      toast({
        title: "Error",
        description: error.reason || "Failed to submit validation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!contractService || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    const minStake = parseFloat(minStakeAmount);
    
    if (amount < minStake) {
      toast({
        title: "Invalid Amount",
        description: `Minimum stake amount is ${minStakeAmount} RTK`,
        variant: "destructive"
      });
      return;
    }

    if (amount > parseFloat(rtkBalance)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${rtkBalance} RTK tokens`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Approving RTK tokens:', {
        spender: contractService['CONTRACT_ADDRESSES']?.rewardManager,
        amount: stakeAmount
      });

      const approveTx = await contractService.approveRTK(
        contractService['CONTRACT_ADDRESSES']?.rewardManager || '0x641D0Bf2936E2183443c60513b1094Ff5E39D42F',
        stakeAmount
      );
      
      toast({
        title: "Approval Submitted",
        description: "Approving tokens for staking..."
      });

      await approveTx.wait();
      
      toast({
        title: "Approval Successful",
        description: "Tokens approved! You can now stake."
      });

      setStakingStep('stake');
      loadValidatorData(); // Refresh allowance
    } catch (error: any) {
      console.error('Error approving tokens:', error);
      toast({
        title: "Error",
        description: error.reason || "Failed to approve tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!contractService || !stakeAmount) return;

    setLoading(true);
    try {
      console.log('Staking tokens:', stakeAmount);

      const stakeTx = await contractService.stake(stakeAmount);
      
      toast({
        title: "Stake Submitted", 
        description: "Your tokens are being staked..."
      });

      await stakeTx.wait();
      
      toast({
        title: "Success",
        description: "Tokens staked successfully!"
      });

      setStakeAmount('');
      setStakingStep('complete');
      loadValidatorData();
    } catch (error: any) {
      console.error('Error staking:', error);
      toast({
        title: "Error",
        description: error.reason || "Failed to stake tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!contractService || !unstakeAmount) return;

    const amount = parseFloat(unstakeAmount);
    const staked = parseFloat(stakedAmount);
    
    if (amount > staked) {
      toast({
        title: "Invalid Amount",
        description: `You only have ${stakedAmount} RTK staked`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const tx = await contractService.unstake(unstakeAmount);
      
      toast({
        title: "Unstake Submitted",
        description: "Your tokens are being unstaked..."
      });

      await tx.wait();
      
      toast({
        title: "Success",
        description: "Tokens unstaked successfully!"
      });

      setUnstakeAmount('');
      loadValidatorData();
    } catch (error: any) {
      console.error('Error unstaking:', error);
      toast({
        title: "Error",
        description: error.reason || "Failed to unstake tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const canStake = () => {
    const amount = parseFloat(stakeAmount);
    const currentAllowance = parseFloat(allowance);
    return amount > 0 && currentAllowance >= amount;
  };

  const needsApproval = () => {
    const amount = parseFloat(stakeAmount);
    const currentAllowance = parseFloat(allowance);
    return amount > 0 && currentAllowance < amount;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validator Dashboard</h1>
          <p className="text-gray-600">Validate reports and monitor appeals</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
          <TabsTrigger value="staking">Staking & Rewards</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
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
                          <p className="text-sm text-muted-foreground">Reporter: {task.pelapor}</p>
                        </div>
                        <Badge>Pending Validation</Badge>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm">{task.description}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label className="text-base font-medium">Validation Decision</Label>
                          <div className="flex space-x-6">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`valid-${task.reportId}`}
                                name={`validation-${task.reportId}`}
                                checked={validationResults[task.reportId]?.isValid === true}
                                onChange={() => updateValidationResult(task.reportId, 'isValid', true)}
                                className="w-4 h-4 text-green-600"
                              />
                              <Label htmlFor={`valid-${task.reportId}`} className="text-green-700 font-medium">
                                ✓ Mark as Valid
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`invalid-${task.reportId}`}
                                name={`validation-${task.reportId}`}
                                checked={validationResults[task.reportId]?.isValid === false}
                                onChange={() => updateValidationResult(task.reportId, 'isValid', false)}
                                className="w-4 h-4 text-red-600"
                              />
                              <Label htmlFor={`invalid-${task.reportId}`} className="text-red-700 font-medium">
                                ✗ Mark as Invalid
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`desc-${task.reportId}`}>Validation Description</Label>
                          <Textarea
                            id={`desc-${task.reportId}`}
                            placeholder={`Enter your validation notes... ${
                              validationResults[task.reportId]?.isValid === false 
                                ? '(Please explain why this report is invalid)' 
                                : '(Describe your validation findings)'
                            }`}
                            value={validationResults[task.reportId]?.description || ''}
                            onChange={(e) => updateValidationResult(task.reportId, 'description', e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>

                        <Button 
                          onClick={() => handleValidation(task.reportId)}
                          className={`w-full ${
                            validationResults[task.reportId]?.isValid === true
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                              : validationResults[task.reportId]?.isValid === false
                              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                              : 'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}
                          disabled={
                            loading || 
                            !validationResults[task.reportId]?.description ||
                            validationResults[task.reportId]?.isValid === undefined
                          }
                        >
                          {loading 
                            ? 'Submitting...' 
                            : validationResults[task.reportId]?.isValid === true
                            ? 'Submit as Valid'
                            : validationResults[task.reportId]?.isValid === false
                            ? 'Submit as Invalid'
                            : 'Select Valid/Invalid First'
                          }
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add appealed reports section */}
        <TabsContent value="appeals" className="space-y-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                Reports You Validated - Now Under Appeal
              </CardTitle>
              <p className="text-sm text-gray-600">
                These reports were marked as Invalid by you, but are now being appealed by the reporters.
              </p>
            </CardHeader>
            <CardContent>
              {appealedReports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No appeals for your validations</p>
              ) : (
                <div className="space-y-4">
                  {appealedReports.map((report) => (
                    <div key={report.reportId} className="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Report #{report.reportId}</h4>
                          <p className="text-sm text-gray-600">{report.title}</p>
                        </div>
                        <Badge className="bg-purple-500 text-white">
                          Appeal Pending
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="font-medium text-gray-700">Reporter:</p>
                          <p className="font-mono text-gray-600">{report.pelapor}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Original Validation Date:</p>
                          <p className="text-gray-600">
                            {new Date(report.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div className="text-sm text-amber-800">
                            <p><strong>Appeal Notice:</strong> The reporter has disagreed with your "Invalid" decision and submitted an appeal.</p>
                            <p className="mt-1">The admin will review both your validation and the reporter's appeal to make a final decision.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staking" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Staked Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(stakedAmount).toFixed(2)} RTK</p>
                <p className="text-sm text-muted-foreground">Currently staked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">RTK Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{parseFloat(rtkBalance).toFixed(2)} RTK</p>
                <p className="text-sm text-muted-foreground">Available to stake</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Min Stake</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{parseFloat(minStakeAmount).toFixed(2)} RTK</p>
                <p className="text-sm text-muted-foreground">Minimum required</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Allowance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">{parseFloat(allowance).toFixed(2)} RTK</p>
                <p className="text-sm text-muted-foreground">Approved for staking</p>
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
                    placeholder={`Min: ${minStakeAmount} RTK`}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Balance: {rtkBalance} RTK | Min: {minStakeAmount} RTK | Approved: {allowance} RTK
                  </p>
                </div>

                {needsApproval() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        You need to approve {stakeAmount} RTK tokens first
                      </p>
                    </div>
                  </div>
                )}

                {canStake() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-800">
                        Ready to stake {stakeAmount} RTK tokens
                      </p>
                    </div>
                  </div>
                )}

                {needsApproval() ? (
                  <Button 
                    onClick={handleApprove}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                  >
                    {loading ? 'Approving...' : `Approve ${stakeAmount} RTK`}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStake}
                    className="w-full bg-gradient-to-r from-blue-500 to-green-500"
                    disabled={loading || !canStake()}
                  >
                    {loading ? 'Staking...' : 'Stake Tokens'}
                  </Button>
                )}
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
                  disabled={loading || !unstakeAmount}
                >
                  {loading ? 'Processing...' : 'Unstake Tokens'}
                </Button>
              </CardContent>
            </Card>
          </div>
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
                  <Label>Wallet Address</Label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">{address}</p>
                </div>
                <div className="space-y-2">
                  <Label>Current Stake</Label>
                  <p className="text-2xl font-bold text-blue-600">{parseFloat(stakedAmount).toFixed(2)} RTK</p>
                </div>
                <div className="space-y-2">
                  <Label>Active Tasks</Label>
                  <p className="text-2xl font-bold text-green-600">{tasks.length}</p>
                </div>
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <p className="text-lg">January 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValidatorDashboard;
