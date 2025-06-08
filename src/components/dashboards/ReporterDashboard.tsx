
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, History, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '@/hooks/use-toast';

const ReporterDashboard: React.FC = () => {
  const { contractService, address } = useWallet();
  const { toast } = useToast();
  const [reportForm, setReportForm] = useState({
    institusiId: '',
    judul: '',
    deskripsi: ''
  });
  const [myReports, setMyReports] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRegisteredReporter, setIsRegisteredReporter] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadInstitutions();
    loadMyReports();
  }, [contractService, address]);

  const loadInstitutions = async () => {
    if (!contractService) return;

    try {
      const count = await contractService.getInstitusiCount();
      const institutionsList = [];
      
      for (let i = 1; i <= count; i++) {
        try {
          const [nama] = await contractService.getInstitusiData(i);
          
          // Check if user is registered as reporter for this institution
          let isReporter = false;
          if (address) {
            isReporter = await contractService.isPelapor(i, address);
          }
          
          institutionsList.push({ 
            id: i.toString(), 
            name: nama,
            isRegistered: isReporter
          });
          
          setIsRegisteredReporter(prev => ({
            ...prev,
            [i.toString()]: isReporter
          }));
        } catch (error) {
          console.log(`Institution ${i} not found`);
        }
      }
      
      setInstitutions(institutionsList);
    } catch (error) {
      console.error('Error loading institutions:', error);
      toast({
        title: "Error",
        description: "Failed to load institutions",
        variant: "destructive"
      });
    }
  };

  const loadMyReports = async () => {
    if (!contractService || !address) return;

    try {
      const totalReports = await contractService.getLaporanCount();
      const userReports = [];

      for (let i = 1; i <= totalReports; i++) {
        try {
          const laporan = await contractService.getLaporan(i);
          if (laporan.pelapor.toLowerCase() === address.toLowerCase()) {
            userReports.push({
              id: laporan.laporanId.toString(),
              title: laporan.judul,
              description: laporan.deskripsi,
              status: laporan.status,
              institution: `Institution ${laporan.institusiId}`,
              submittedAt: new Date(Number(laporan.creationTimestamp) * 1000).toLocaleDateString(),
              validationResult: laporan.status !== 'Menunggu' ? 'Validation completed' : null
            });
          }
        } catch (error) {
          console.log(`Report ${i} not found or error`);
        }
      }

      setMyReports(userReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleSubmitReport = async () => {
    if (!contractService || !reportForm.institusiId || !reportForm.judul || !reportForm.deskripsi) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    // Check if user is registered as reporter for selected institution
    if (!isRegisteredReporter[reportForm.institusiId]) {
      toast({
        title: "Error",
        description: "You are not registered as a reporter for this institution. Please contact the institution admin.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting report with data:', {
        institusiId: parseInt(reportForm.institusiId),
        judul: reportForm.judul,
        deskripsi: reportForm.deskripsi
      });

      const tx = await contractService.buatLaporan(
        parseInt(reportForm.institusiId),
        reportForm.judul,
        reportForm.deskripsi
      );
      
      toast({
        title: "Transaction Submitted",
        description: `Transaction hash: ${tx.hash}. Your report is being submitted...`
      });

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      toast({
        title: "Success",
        description: "Report submitted successfully!"
      });

      setReportForm({
        institusiId: '',
        judul: '',
        deskripsi: ''
      });

      loadMyReports();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      
      let errorMessage = "Failed to submit report";
      if (error.reason) {
        errorMessage = `Error: ${error.reason}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async (reportId: string) => {
    if (!contractService) return;

    setLoading(true);
    try {
      // Get stake amount first
      const stakeAmount = await contractService.getStakeBandingAmount();
      console.log('Required stake amount for appeal:', stakeAmount);

      // Check RTK balance
      const balance = await contractService.getRTKBalance(address!);
      console.log('Current RTK balance:', balance);

      if (parseFloat(balance) < parseFloat(stakeAmount)) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${stakeAmount} RTK tokens to submit an appeal. Current balance: ${balance} RTK`,
          variant: "destructive"
        });
        return;
      }

      // First approve tokens for appeal stake
      const approveTx = await contractService.approveRTK(
        contractService['CONTRACT_ADDRESSES']?.rewardManager || '0x641D0Bf2936E2183443c60513b1094Ff5E39D42F',
        stakeAmount
      );
      
      toast({
        title: "Approval Submitted",
        description: "Approving tokens for appeal stake..."
      });

      await approveTx.wait();
      
      const tx = await contractService.ajukanBanding(parseInt(reportId));
      
      toast({
        title: "Appeal Submitted",
        description: "Your appeal is being processed..."
      });

      await tx.wait();
      
      toast({
        title: "Success",
        description: "Appeal submitted successfully!"
      });

      loadMyReports();
    } catch (error: any) {
      console.error('Error submitting appeal:', error);
      toast({
        title: "Error", 
        description: error.reason || "Failed to submit appeal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu':
        return <Badge className="bg-yellow-500">Menunggu</Badge>;
      case 'Valid':
        return <Badge className="bg-green-500">Valid</Badge>;
      case 'Tidak Valid':
        return <Badge className="bg-red-500">Tidak Valid</Badge>;
      case 'Banding':
        return <Badge className="bg-purple-500">Banding</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="w-8 h-8 text-orange-600" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Reporter Dashboard
        </h2>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Report</TabsTrigger>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Submit New Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="institution">Select Institution</Label>
                <Select 
                  value={reportForm.institusiId} 
                  onValueChange={(value) => setReportForm({...reportForm, institusiId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id} disabled={!inst.isRegistered}>
                        <div className="flex items-center space-x-2">
                          <span>{inst.name}</span>
                          {!inst.isRegistered && (
                            <div className="flex items-center space-x-1 text-red-500">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs">Not registered</span>
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reportForm.institusiId && !isRegisteredReporter[reportForm.institusiId] && (
                  <p className="text-sm text-red-600">
                    You are not registered as a reporter for this institution. Contact the admin to be added.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="Enter report title"
                  value={reportForm.judul}
                  onChange={(e) => setReportForm({...reportForm, judul: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Report Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the incident or issue in detail..."
                  rows={6}
                  value={reportForm.deskripsi}
                  onChange={(e) => setReportForm({...reportForm, deskripsi: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleSubmitReport}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                disabled={!reportForm.institusiId || !reportForm.judul || !reportForm.deskripsi || loading || !isRegisteredReporter[reportForm.institusiId]}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>My Report History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports submitted yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Your reports will appear here after submission</p>
                  </div>
                ) : (
                  myReports.map((report, index) => (
                    <div key={index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">Report ID: {report.id}</p>
                          <p className="text-sm text-muted-foreground">Submitted to: {report.institution}</p>
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(report.status)}
                          <p className="text-xs text-muted-foreground">{report.submittedAt}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm">{report.description}</p>
                      </div>

                      {report.validationResult && (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-800">Validation Result:</p>
                          <p className="text-sm text-blue-700">{report.validationResult}</p>
                        </div>
                      )}

                      {report.status === 'Tidak Valid' && (
                        <div className="pt-2">
                          <Button 
                            onClick={() => handleAppeal(report.id)}
                            className="bg-purple-500 hover:bg-purple-600"
                            size="sm"
                            disabled={loading}
                          >
                            {loading ? 'Processing...' : 'Submit Appeal'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Appeal requires staking tokens. You will get them back if appeal is successful.
                          </p>
                        </div>
                      )}
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

export default ReporterDashboard;
