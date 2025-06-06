
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Plus, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Coins,
  TrendingUp,
  Shield,
  Eye
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '@/hooks/use-toast';

const ModernReporterDashboard: React.FC = () => {
  const { contractService, address } = useWallet();
  const { toast } = useToast();
  const [reportForm, setReportForm] = useState({
    institusiId: '',
    judul: '',
    deskripsi: ''
  });
  const [myReports, setMyReports] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    validReports: 0,
    invalidReports: 0
  });
  const [loading, setLoading] = useState(false);
  const [stakeBandingAmount, setStakeBandingAmount] = useState('0');

  useEffect(() => {
    loadData();
  }, [contractService, address]);

  const loadData = async () => {
    await Promise.all([
      loadInstitutions(),
      loadMyReports(),
      loadStakeBandingAmount()
    ]);
  };

  const loadInstitutions = async () => {
    if (!contractService) return;

    try {
      const count = await contractService.getInstitusiCount();
      const institutionsList = [];
      
      for (let i = 1; i <= count; i++) {
        try {
          const [nama] = await contractService.getInstitusiData(i);
          institutionsList.push({ id: i.toString(), name: nama });
        } catch (error) {
          console.log(`Institution ${i} not found`);
        }
      }
      
      setInstitutions(institutionsList);
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  };

  const loadMyReports = async () => {
    if (!contractService || !address) return;

    try {
      const totalReports = await contractService.getLaporanCount();
      const userReports = [];
      let pending = 0, valid = 0, invalid = 0;

      for (let i = 1; i <= totalReports; i++) {
        try {
          const laporan = await contractService.getLaporan(i);
          if (laporan.pelapor.toLowerCase() === address.toLowerCase()) {
            const isBanding = await contractService.isBanding(i);
            
            userReports.push({
              id: laporan.laporanId.toString(),
              title: laporan.judul,
              description: laporan.deskripsi,
              status: laporan.status,
              institution: `Institution ${laporan.institusiId}`,
              submittedAt: new Date(Number(laporan.creationTimestamp) * 1000).toLocaleDateString(),
              validationResult: laporan.status !== 'Menunggu' ? 'Validation completed' : null,
              isBanding: isBanding,
              validator: laporan.assignedValidator
            });

            // Count stats
            if (laporan.status === 'Menunggu') pending++;
            else if (laporan.status === 'Valid') valid++;
            else if (laporan.status === 'Tidak Valid') invalid++;
          }
        } catch (error) {
          console.log(`Report ${i} not found or error`);
        }
      }

      setMyReports(userReports);
      setStats({
        totalReports: userReports.length,
        pendingReports: pending,
        validReports: valid,
        invalidReports: invalid
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadStakeBandingAmount = async () => {
    if (!contractService) return;
    try {
      const amount = await contractService.getStakeBandingAmount();
      setStakeBandingAmount(amount);
    } catch (error) {
      console.error('Error loading stake banding amount:', error);
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

    setLoading(true);
    try {
      const tx = await contractService.buatLaporan(
        parseInt(reportForm.institusiId),
        reportForm.judul,
        reportForm.deskripsi
      );
      
      toast({
        title: "Transaction Submitted",
        description: "Your report is being submitted..."
      });

      await tx.wait();
      
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
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
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
      // First approve tokens for appeal stake
      await contractService.approveRTK(contractService['CONTRACT_ADDRESSES'].user, stakeBandingAmount);
      
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
    } catch (error) {
      console.error('Error submitting appeal:', error);
      toast({
        title: "Error", 
        description: "Failed to submit appeal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isBanding: boolean = false) => {
    if (isBanding) {
      return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Appeal Pending
      </Badge>;
    }

    switch (status) {
      case 'Menunggu':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'Valid':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Valid
        </Badge>;
      case 'Tidak Valid':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Invalid
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressValue = () => {
    if (stats.totalReports === 0) return 0;
    return (stats.validReports / stats.totalReports) * 100;
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Reporter Dashboard
            </h2>
            <p className="text-gray-600 mt-1">Submit and track your reports</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.validReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Invalid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.invalidReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Success Rate</h3>
            </div>
            <span className="text-2xl font-bold text-green-600">{getProgressValue().toFixed(1)}%</span>
          </div>
          <Progress value={getProgressValue()} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            {stats.validReports} out of {stats.totalReports} reports validated
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Report</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>My Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Plus className="w-5 h-5 text-orange-600" />
                </div>
                <span>Submit New Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="institution" className="text-sm font-medium">Select Institution</Label>
                <Select 
                  value={reportForm.institusiId} 
                  onValueChange={(value) => setReportForm({...reportForm, institusiId: value})}
                >
                  <SelectTrigger className="h-12 bg-white border-gray-200">
                    <SelectValue placeholder="Choose an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>{inst.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Report Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a clear, descriptive title"
                  value={reportForm.judul}
                  onChange={(e) => setReportForm({...reportForm, judul: e.target.value})}
                  className="h-12 bg-white border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Report Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the incident or issue..."
                  rows={6}
                  value={reportForm.deskripsi}
                  onChange={(e) => setReportForm({...reportForm, deskripsi: e.target.value})}
                  className="bg-white border-gray-200 resize-none"
                />
              </div>

              <Button 
                onClick={handleSubmitReport}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={!reportForm.institusiId || !reportForm.judul || !reportForm.deskripsi || loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Submit Report</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <span>My Report History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {myReports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
                    <p className="text-gray-600">Your submitted reports will appear here</p>
                  </div>
                ) : (
                  myReports.map((report, index) => (
                    <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-lg text-gray-900">{report.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>ID: #{report.id}</span>
                              <span>•</span>
                              <span>{report.institution}</span>
                              <span>•</span>
                              <span>{report.submittedAt}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {getStatusBadge(report.status, report.isBanding)}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-gray-700">{report.description}</p>
                        </div>

                        {report.validator && (
                          <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
                            <div className="flex items-center space-x-2 mb-2">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <p className="text-sm font-medium text-blue-800">Assigned Validator</p>
                            </div>
                            <p className="text-sm text-blue-700 font-mono">{report.validator}</p>
                          </div>
                        )}

                        {report.status === 'Tidak Valid' && !report.isBanding && (
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                              <div>
                                <p className="font-medium text-purple-800">Appeal this decision</p>
                                <p className="text-sm text-purple-600">
                                  Stake {parseFloat(stakeBandingAmount).toFixed(2)} RTK to appeal
                                </p>
                              </div>
                              <Button 
                                onClick={() => handleAppeal(report.id)}
                                className="bg-purple-500 hover:bg-purple-600 text-white"
                                size="sm"
                                disabled={loading}
                              >
                                {loading ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Processing...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <Coins className="w-4 h-4" />
                                    <span>Submit Appeal</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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

export default ModernReporterDashboard;
