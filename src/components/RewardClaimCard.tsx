
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useToast } from '@/hooks/use-toast';

interface RewardClaimCardProps {
  reportId: number;
  contributionLevel: number;
  onRewardClaimed: () => void;
}

const RewardClaimCard: React.FC<RewardClaimCardProps> = ({ 
  reportId, 
  contributionLevel, 
  onRewardClaimed 
}) => {
  const { contractService, address } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [baseReward, setBaseReward] = useState('0');

  useEffect(() => {
    checkClaimStatus();
    loadRewardInfo();
  }, [contractService, address, reportId]);

  const checkClaimStatus = async () => {
    if (!contractService || !address) return;

    try {
      const claimed = await contractService.hasValidatorClaimedReward(reportId, address);
      setAlreadyClaimed(claimed);
    } catch (error) {
      console.error('Error checking claim status:', error);
    }
  };

  const loadRewardInfo = async () => {
    if (!contractService) return;

    try {
      const reward = await contractService.getBaseRewardPerLevel();
      setBaseReward(reward);
    } catch (error) {
      console.error('Error loading reward info:', error);
    }
  };

  const handleClaimReward = async () => {
    if (!contractService) return;

    setLoading(true);
    try {
      const tx = await contractService.claimReward(reportId);
      
      toast({
        title: "Reward Claim Submitted",
        description: "Your reward claim is being processed..."
      });

      await tx.wait();
      
      toast({
        title: "Success",
        description: "Reward claimed successfully!"
      });

      setAlreadyClaimed(true);
      onRewardClaimed();
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Error",
        description: error.reason || "Failed to claim reward",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateReward = () => {
    return (parseFloat(baseReward) * contributionLevel).toFixed(2);
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-green-600" />
          <span>Reward Available</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Report ID: {reportId}</p>
            <p className="text-sm text-muted-foreground">Contribution Level: {contributionLevel}</p>
          </div>
          <Badge className="bg-green-100 text-green-800">
            {calculateReward()} RTK
          </Badge>
        </div>

        {alreadyClaimed ? (
          <div className="bg-gray-100 p-3 rounded-lg text-center">
            <Gift className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Reward already claimed</p>
          </div>
        ) : (
          <Button 
            onClick={handleClaimReward}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500"
            disabled={loading}
          >
            {loading ? 'Claiming...' : `Claim ${calculateReward()} RTK`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RewardClaimCard;
