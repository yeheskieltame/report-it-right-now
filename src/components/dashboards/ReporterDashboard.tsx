import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, History, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { CONTRACT_ADDRESSES } from '../../config/contracts';

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
  const [validationStatus, setValidationStatus] = useState<{[key: string]: 'checking' | 'valid' | 'invalid'}>({});

  useEffect(() => {
    loadInstitutions();
    loadMyReports();
  }, [contractService, address]);

  const loadInstitutions = async () => {
    if (!contractService) return;

    try {
      console.log('Loading institutions...');
      const count = await contractService.getInstitusiCount();
      console.log('Institution count:', count);
      
      const institutionsList = [];
      
      for (let i = 1; i <= count; i++) {
        try {
          const [nama] = await contractService.getInstitusiData(i);
          console.log(`Institution ${i}:`, nama);
          
          // Check if user is registered as reporter for this institution
          let isReporter = false;
          if (address) {
            isReporter = await contractService.isPelapor(i, address);
            console.log(`User ${address} is reporter for institution ${i}:`, isReporter);
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
          console.log(`Institution ${i} not found:`, error);
        }
      }
      
      console.log('Final institutions list:', institutionsList);
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

  const validateReportSubmission = async (institusiId: string) => {
    if (!contractService || !address || !institusiId) return false;
    
    console.log('Validating report submission for institution:', institusiId);
    setValidationStatus(prev => ({ ...prev, [institusiId]: 'checking' }));
    
    try {
      const institusiIdNum = parseInt(institusiId);
      
      // Check if institution exists
      const institutionCount = await contractService.getInstitusiCount();
      console.log('Institution count for validation:', institutionCount);
      
      if (institusiIdNum > institutionCount || institusiIdNum <= 0) {
        console.log('Invalid institution ID:', institusiIdNum);
        setValidationStatus(prev => ({ ...prev, [institusiId]: 'invalid' }));
        toast({
          title: "Invalid Institution",
          description: `Invalid institution ID: ${institusiIdNum}. Valid range: 1-${institutionCount}`,
          variant: "destructive"
        });
        return false;
      }
      
      // Check if user is registered as reporter
      const isReporter = await contractService.isPelapor(institusiIdNum, address);
      console.log('Is user registered as reporter:', isReporter);
      
      if (!isReporter) {
        setValidationStatus(prev => ({ ...prev, [institusiId]: 'invalid' }));
        toast({
          title: "Not Authorized", 
          description: "You are not registered as a reporter for this institution",
          variant: "destructive"
        });
        return false;
      }
      
      setValidationStatus(prev => ({ ...prev, [institusiId]: 'valid' }));
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [institusiId]: 'invalid' }));
      toast({
        title: "Validation Error",
        description: "Failed to validate reporter status",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSubmitReport = async () => {
    console.log('=== SUBMIT REPORT INITIATED ===');
    console.log('Form data:', reportForm);
    
    // Basic form validation
    if (!reportForm.institusiId) {
      console.log('Missing institution ID');
      toast({
        title: "Error",
        description: "Please select an institution",
        variant: "destructive"
      });
      return;
    }
    
    if (!reportForm.judul || !reportForm.judul.trim()) {
      console.log('Missing or empty title');
      toast({
        title: "Error",
        description: "Please enter a report title",
        variant: "destructive"
      });
      return;
    }
    
    if (!reportForm.deskripsi || !reportForm.deskripsi.trim()) {
      console.log('Missing or empty description');
      toast({
        title: "Error",
        description: "Please enter a report description",
        variant: "destructive"
      });
      return;
    }

    if (!contractService) {
      console.log('Contract service not available');
      toast({
        title: "Error",
        description: "Contract service not available",
        variant: "destructive"
      });
      return;
    }

    // Validate before submission
    console.log('Validating submission...');
    const isValid = await validateReportSubmission(reportForm.institusiId);
    if (!isValid) {
      console.log('Validation failed');
      return;
    }

    setLoading(true);
    
    try {
      const institusiIdNum = parseInt(reportForm.institusiId);
      const cleanTitle = reportForm.judul.trim();
      const cleanDescription = reportForm.deskripsi.trim();
      
      console.log('Submitting report with cleaned data:', {
        institusiId: institusiIdNum,
        judul: cleanTitle,
        deskripsi: cleanDescription
      });
      
      // Additional validation
      if (isNaN(institusiIdNum) || institusiIdNum <= 0) {
        throw new Error('Invalid institution ID format');
      }
      
      if (cleanTitle.length === 0) {
        throw new Error('Title cannot be empty');
      }
      
      if (cleanDescription.length === 0) {
        throw new Error('Description cannot be empty');
      }

      const tx = await contractService.buatLaporan(
        institusiIdNum,
        cleanTitle,
        cleanDescription
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

      // Reset form
      setReportForm({
        institusiId: '',
        judul: '',
        deskripsi: ''
      });

      // Clear validation status
      setValidationStatus({});

      // Reload reports
      loadMyReports();
      
    } catch (error: any) {
      console.error('=== ERROR SUBMITTING REPORT ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = "Failed to submit report";
      
      if (error.message) {
        if (error.message.includes('not registered as a reporter')) {
          errorMessage = "You are not registered as a reporter for this institution";
        } else if (error.message.includes('Institution') && error.message.includes('does not exist')) {
          errorMessage = "Selected institution does not exist";
        } else if (error.message.includes('Gas estimation failed')) {
          errorMessage = "Transaction validation failed. Please check your inputs and try again.";
        } else {
          errorMessage = error.message;
        }
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
        CONTRACT_ADDRESSES.rewardManager,
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

  const getValidationIcon = (institusiId: string) => {
    const status = validationStatus[institusiId];
    switch (status) {
      case 'checking':
        return <div className="w-4 h-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Form validation helpers
  const isFormValid = () => {
    return (
      reportForm.institusiId && 
      reportForm.judul.trim().length > 0 && 
      reportForm.deskripsi.trim().length > 0 && 
      validationStatus[reportForm.institusiId] === 'valid'
    );
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
                <Label htmlFor="institution">Select Institution *</Label>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={reportForm.institusiId} 
                    onValueChange={(value) => {
                      console.log('Institution selected:', value);
                      setReportForm({...reportForm, institusiId: value});
                      if (value) {
                        validateReportSubmission(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
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
                  {reportForm.institusiId && getValidationIcon(reportForm.institusiId)}
                </div>
                {reportForm.institusiId && validationStatus[reportForm.institusiId] === 'invalid' && (
                  <p className="text-sm text-red-500">You must be registered as a reporter for this institution</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter report title"
                  value={reportForm.judul}
                  onChange={(e) => {
                    console.log('Title changed:', e.target.value);
                    setReportForm({...reportForm, judul: e.target.value});
                  }}
                  maxLength={100}
                  className={reportForm.judul.trim().length === 0 && reportForm.judul.length > 0 ? 'border-red-500' : ''}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500">{reportForm.judul.length}/100 characters</p>
                  {reportForm.judul.trim().length === 0 && reportForm.judul.length > 0 && (
                    <p className="text-xs text-red-500">Title cannot be empty</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Report Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the incident or issue in detail..."
                  rows={6}
                  value={reportForm.deskripsi}
                  onChange={(e) => {
                    console.log('Description changed:', e.target.value);
                    setReportForm({...reportForm, deskripsi: e.target.value});
                  }}
                  maxLength={500}
                  className={reportForm.deskripsi.trim().length === 0 && reportForm.deskripsi.length > 0 ? 'border-red-500' : ''}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500">{reportForm.deskripsi.length}/500 characters</p>
                  {reportForm.deskripsi.trim().length === 0 && reportForm.deskripsi.length > 0 && (
                    <p className="text-xs text-red-500">Description cannot be empty</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Before submitting:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Ensure you are registered as a reporter for the selected institution</li>
                  <li>• Provide a clear and descriptive title</li>
                  <li>• Include detailed information in the description</li>
                  <li>• Double-check all information before submitting</li>
                </ul>
              </div>

              <Button 
                onClick={handleSubmitReport}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                disabled={!isFormValid() || loading}
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
