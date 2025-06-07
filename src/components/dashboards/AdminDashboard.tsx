
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, Scale, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { toast } from 'sonner';

interface InstitutionData {
  institusiId: number;
  nama: string;
  admin: string;
  treasury: string;
}

interface ValidatorInfo {
  address: string;
  reputation: number;
  isActive: boolean;
}

interface ReportData {
  id: number;
  title: string;
  description: string;
  status: string;
  pelapor: string;
  timestamp: number;
}

const AdminDashboard: React.FC = () => {
  const { contractService, address } = useWallet();
  const [newValidatorAddress, setNewValidatorAddress] = useState('');
  const [newReporterAddress, setNewReporterAddress] = useState('');
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [reporters, setReporters] = useState<string[]>([]);
  const [validatedReports, setValidatedReports] = useState<ReportData[]>([]);
  const [appealReports, setAppealReports] = useState<ReportData[]>([]);
  const [institutionData, setInstitutionData] = useState<InstitutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [contributionLevel, setContributionLevel] = useState<{[key: number]: number}>({});

  // Get current institution ID from localStorage
  const selectedInstitution = localStorage.getItem('selectedInstitution');
  const institusiId = selectedInstitution ? parseInt(selectedInstitution) : 0;

  useEffect(() => {
    if (contractService && institusiId > 0) {
      loadInstitutionData();
    }
  }, [contractService, institusiId]);

  const loadInstitutionData = async () => {
    if (!contractService || institusiId === 0) return;
    
    setLoading(true);
    try {
      // Load institution data
      const [nama, admin, treasury] = await contractService.getInstitusiData(institusiId);
      setInstitutionData({
        institusiId,
        nama,
        admin,
        treasury
      });

      // Load validators
      await loadValidators();
      
      // Load reports
      await loadReports();
      
    } catch (error) {
      console.error('Error loading institution data:', error);
      toast.error('Gagal memuat data institusi');
    } finally {
      setLoading(false);
    }
  };

  const loadValidators = async () => {
    if (!contractService) return;
    
    try {
      const validatorAddresses = await contractService.getValidatorList(institusiId);
      const validatorInfos: ValidatorInfo[] = [];
      
      for (const validatorAddr of validatorAddresses) {
        try {
          const reputation = await contractService.getValidatorReputation(validatorAddr);
          const stakedAmount = await contractService.getStakedAmount(validatorAddr);
          const minStake = await contractService.getMinStakeAmount();
          
          validatorInfos.push({
            address: validatorAddr,
            reputation,
            isActive: parseFloat(stakedAmount) >= parseFloat(minStake)
          });
        } catch (error) {
          console.error(`Error loading validator ${validatorAddr}:`, error);
        }
      }
      
      setValidators(validatorInfos);
    } catch (error) {
      console.error('Error loading validators:', error);
    }
  };

  const loadReports = async () => {
    if (!contractService) return;
    
    try {
      const totalReports = await contractService.getLaporanCount();
      const validatedReportsList: ReportData[] = [];
      const appealReportsList: ReportData[] = [];
      
      for (let i = 1; i <= totalReports; i++) {
        try {
          const reportDetails = await contractService.getLaporanDetails(i);
          
          // Check if report belongs to this institution
          if (Number(reportDetails.institusiId) === institusiId) {
            const reportData: ReportData = {
              id: Number(reportDetails.laporanId),
              title: reportDetails.judul,
              description: reportDetails.deskripsi,
              status: reportDetails.status,
              pelapor: reportDetails.pelapor,
              timestamp: Number(reportDetails.creationTimestamp)
            };
            
            // Check if it's an appeal
            const isAppeal = await contractService.isBanding(i);
            
            if (isAppeal) {
              appealReportsList.push(reportData);
            } else if (reportData.status === 'Valid' || reportData.status === 'Invalid') {
              validatedReportsList.push(reportData);
            }
          }
        } catch (error) {
          console.log(`Error loading report ${i}:`, error);
        }
      }
      
      setValidatedReports(validatedReportsList);
      setAppealReports(appealReportsList);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleAddValidator = async () => {
    if (!contractService || !newValidatorAddress || institusiId === 0) {
      toast.error('Alamat validator tidak valid');
      return;
    }

    try {
      setLoading(true);
      toast.info('Menambahkan validator...');
      
      const tx = await contractService.tambahValidator(institusiId, newValidatorAddress);
      toast.info('Transaksi dikirim, menunggu konfirmasi...');
      
      await tx.wait();
      toast.success('Validator berhasil ditambahkan!');
      
      setNewValidatorAddress('');
      await loadValidators();
    } catch (error: any) {
      console.error('Error adding validator:', error);
      toast.error(`Gagal menambahkan validator: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReporter = async () => {
    if (!contractService || !newReporterAddress || institusiId === 0) {
      toast.error('Alamat pelapor tidak valid');
      return;
    }

    try {
      setLoading(true);
      toast.info('Menambahkan pelapor...');
      
      const tx = await contractService.tambahPelapor(institusiId, newReporterAddress);
      toast.info('Transaksi dikirim, menunggu konfirmasi...');
      
      await tx.wait();
      toast.success('Pelapor berhasil ditambahkan!');
      
      setNewReporterAddress('');
      // Refresh the page data
      await loadInstitutionData();
    } catch (error: any) {
      console.error('Error adding reporter:', error);
      toast.error(`Gagal menambahkan pelapor: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetContribution = async (reportId: number) => {
    if (!contractService || !contributionLevel[reportId]) {
      toast.error('Level kontribusi tidak valid');
      return;
    }

    try {
      setLoading(true);
      toast.info('Mengatur level kontribusi...');
      
      const tx = await contractService.setContributionLevel(reportId, contributionLevel[reportId]);
      toast.info('Transaksi dikirim, menunggu konfirmasi...');
      
      await tx.wait();
      toast.success('Level kontribusi berhasil diatur!');
      
      await loadReports();
    } catch (error: any) {
      console.error('Error setting contribution:', error);
      toast.error(`Gagal mengatur kontribusi: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAppealDecision = async (reportId: number, userWins: boolean) => {
    if (!contractService) return;

    try {
      setLoading(true);
      toast.info('Memproses keputusan banding...');
      
      const tx = await contractService.finalisasiBanding(reportId, userWins);
      toast.info('Transaksi dikirim, menunggu konfirmasi...');
      
      await tx.wait();
      toast.success(`Banding ${userWins ? 'diterima' : 'ditolak'}!`);
      
      await loadReports();
    } catch (error: any) {
      console.error('Error processing appeal:', error);
      toast.error(`Gagal memproses banding: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveValidator = async (validatorAddress: string) => {
    if (!contractService) return;

    try {
      setLoading(true);
      toast.info('Menghapus validator...');
      
      const tx = await contractService.removeValidator(institusiId, validatorAddress);
      toast.info('Transaksi dikirim, menunggu konfirmasi...');
      
      await tx.wait();
      toast.success('Validator berhasil dihapus!');
      
      await loadValidators();
    } catch (error: any) {
      console.error('Error removing validator:', error);
      toast.error(`Gagal menghapus validator: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!institutionData && !loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Institusi Tidak Ditemukan</h3>
            <p className="text-muted-foreground">Silakan pilih institusi terlebih dahulu</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Building2 className="w-8 h-8 text-blue-600" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Institution Admin Dashboard
        </h2>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="reports">Review Reports</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Institution Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{institutionData?.nama || 'Loading...'}</p>
                <p className="text-sm text-muted-foreground">Institution ID: {institusiId}</p>
                <p className="text-xs text-muted-foreground mt-2">Treasury: {institutionData?.treasury}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Validators</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{validators.length}</p>
                <p className="text-sm text-muted-foreground">Registered validators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{validatedReports.length}</p>
                <p className="text-sm text-muted-foreground">Validated reports</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Validator List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading validators...</p>
                ) : validators.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No validators registered</p>
                ) : (
                  validators.map((validator, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{validator.address}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Reputation: {validator.reputation}</Badge>
                        <Badge className={validator.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {validator.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          onClick={() => handleRemoveValidator(validator.address)}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Add New Validator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="validator-address">Validator Address</Label>
                  <Input
                    id="validator-address"
                    placeholder="0x..."
                    value={newValidatorAddress}
                    onChange={(e) => setNewValidatorAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button 
                  onClick={handleAddValidator}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500"
                  disabled={loading || !newValidatorAddress}
                >
                  {loading ? 'Adding...' : 'Add Validator'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Add New Reporter</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reporter-address">Reporter Address</Label>
                  <Input
                    id="reporter-address"
                    placeholder="0x..."
                    value={newReporterAddress}
                    onChange={(e) => setNewReporterAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button 
                  onClick={handleAddReporter}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                  disabled={loading || !newReporterAddress}
                >
                  {loading ? 'Adding...' : 'Add Reporter'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Validated Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading reports...</p>
                ) : validatedReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No validated reports</p>
                ) : (
                  validatedReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">ID: {report.id}</p>
                          <p className="text-sm text-muted-foreground">Reporter: {report.pelapor}</p>
                        </div>
                        <Badge className={report.status === 'Valid' ? 'bg-green-500' : 'bg-red-500'}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm">{report.description}</p>
                      <div className="flex items-center space-x-4">
                        <Input 
                          type="number" 
                          placeholder="Level (1-5)" 
                          min="1" 
                          max="5" 
                          className="w-32"
                          value={contributionLevel[report.id] || ''}
                          onChange={(e) => setContributionLevel(prev => ({
                            ...prev,
                            [report.id]: parseInt(e.target.value) || 1
                          }))}
                          disabled={loading}
                        />
                        <Button 
                          onClick={() => handleSetContribution(report.id)}
                          size="sm"
                          disabled={loading || !contributionLevel[report.id]}
                        >
                          Set Contribution
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="w-5 h-5" />
                <span>Appeal Decisions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading appeals...</p>
                ) : appealReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No appeals to review</p>
                ) : (
                  appealReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">ID: {report.id}</p>
                          <p className="text-sm text-muted-foreground">Reporter: {report.pelapor}</p>
                        </div>
                        <Badge className="bg-yellow-500">Appeal</Badge>
                      </div>
                      <p className="text-sm">{report.description}</p>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleAppealDecision(report.id, true)}
                          className="bg-green-500 hover:bg-green-600"
                          size="sm"
                          disabled={loading}
                        >
                          User Wins
                        </Button>
                        <Button 
                          onClick={() => handleAppealDecision(report.id, false)}
                          className="bg-red-500 hover:bg-red-600"
                          size="sm"
                          disabled={loading}
                        >
                          User Loses
                        </Button>
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

export default AdminDashboard;
