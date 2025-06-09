import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, Scale, AlertCircle, Settings } from 'lucide-react';
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
  validationResult?: {
    isValid: boolean;
    description: string;
    validator: string;
    validationTimestamp: number;
  };
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
  const [contractsInitialized, setContractsInitialized] = useState(false);

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

  // Helper methods for cleaning validation data
  const cleanValidationDescription = (deskripsi: any, reportId: number): string => {
    if (!deskripsi) {
      return `Laporan ${reportId} telah divalidasi - Detail tidak tersedia`;
    }
    
    const desc = String(deskripsi);
    
    // Check for corruption indicators
    if (desc.includes('overflow') || desc.includes('0x') || desc.length > 500) {
      console.warn(`Corrupted description detected for report ${reportId}:`, desc);
      return `Laporan ${reportId} telah divalidasi (detail rusak karena masalah encoding)`;
    }
    
    // Return cleaned description
    return desc.length > 200 ? desc.substring(0, 197) + '...' : desc;
  };

  const cleanValidatorAddress = (validator: any): string => {
    if (!validator) {
      return 'Validator tidak diketahui';
    }
    
    const addr = String(validator);
    
    // Check for known corrupted addresses
    if (addr === '0x0000000000000000000000000000000000000060' || 
        addr === '0x0000000000000000000000000000000000000000' ||
        addr.length !== 42 || 
        !addr.startsWith('0x')) {
      console.warn(`Corrupted validator address detected:`, addr);
      return 'Alamat validator rusak';
    }
    
    return addr;
  };

  const cleanTimestamp = (timestamp: any): number => {
    const ts = Number(timestamp);
    
    // Check if timestamp is reasonable (after 2020 and before 2050)
    if (ts < 1577836800 || ts > 2524608000) {
      console.warn(`Invalid timestamp detected:`, timestamp);
      return Math.floor(Date.now() / 1000); // Use current time as fallback
    }
    
    return ts;
  };

  const getValidationErrorMessage = (error: any, reportId: number): string => {
    if (error?.message?.includes('overflow')) {
      return `Laporan ${reportId} - Data validasi rusak karena ABI overflow error`;
    } else if (error?.message?.includes('ABI')) {
      return `Laporan ${reportId} - Kesalahan decoding ABI pada data validasi`;
    } else if (error?.message?.includes('revert')) {
      return `Laporan ${reportId} - Smart contract mengembalikan error`;
    } else {
      return `Laporan ${reportId} - Error tidak diketahui: ${error?.message || 'Unknown error'}`;
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
          // Use getLaporan instead of getLaporanDetails to avoid decoding issues
          const laporan = await contractService.getLaporan(i);
          
          // Check if report belongs to this institution
          if (Number(laporan.institusiId) === institusiId) {
            const reportData: ReportData = {
              id: Number(laporan.laporanId),
              title: laporan.judul,
              description: laporan.deskripsi,
              status: laporan.status,
              pelapor: laporan.pelapor,
              timestamp: Number(laporan.creationTimestamp)
            };
            
            // Check if it's an appeal
            const isAppeal = await contractService.isBanding(i);
            
            if (isAppeal) {
              appealReportsList.push(reportData);
            } else {
              // Check if report has been validated
              const isValidated = await contractService.isLaporanSudahDivalidasi(i);
              console.log(`Report ${i} validation status:`, isValidated);
              
              if (isValidated) {
                // Get validation results from validator contract with enhanced error handling
                try {
                  // First try to get the validation result using the enhanced method
                  const validationResult = await contractService.getHasilValidasi(i);
                  console.log(`Report ${i} validation result:`, validationResult);
                  
                  // If debugging is needed (for corrupted data), run debug analysis
                  if (!validationResult || 
                      validationResult.validator === '0x0000000000000000000000000000000000000060' ||
                      (validationResult.deskripsi && validationResult.deskripsi.includes('overflow'))) {
                    console.warn(`Report ${i} has corrupted validation data, running debug analysis...`);
                    await contractService.debugValidationDataIssues(i);
                  }
                  
                  // Safely extract validation data with robust fallbacks
                  const validationData = {
                    isValid: Boolean(validationResult?.isValid ?? true), // Default to valid since it's validated
                    description: cleanValidationDescription(validationResult?.deskripsi, i),
                    validator: cleanValidatorAddress(validationResult?.validator),
                    validationTimestamp: cleanTimestamp(validationResult?.timestamp)
                  };
                  
                  // Enhance report data with validation details
                  const enhancedReportData = {
                    ...reportData,
                    validationResult: validationData
                  };
                  
                  validatedReportsList.push(enhancedReportData);
                } catch (validationError) {
                  console.error(`Error getting validation result for report ${i}:`, validationError);
                  
                  // Run comprehensive debugging for this report
                  try {
                    await contractService.debugValidationDataIssues(i);
                  } catch (debugError) {
                    console.error(`Debug analysis failed for report ${i}:`, debugError);
                  }
                  
                  // Always add the validated report with informative fallback data
                  const fallbackValidationData = {
                    isValid: true, // We know it's validated from isLaporanSudahDivalidasi
                    description: getValidationErrorMessage(validationError, i),
                    validator: 'Data unavailable due to ABI corruption',
                    validationTimestamp: 0
                  };
                  
                  const reportWithFallback = {
                    ...reportData,
                    validationResult: fallbackValidationData
                  };
                  
                  validatedReportsList.push(reportWithFallback);
                  console.log(`Added report ${i} with fallback validation data due to fetch error`);
                }
              }
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

  const handleInitializeContracts = async () => {
    if (!contractService) {
      toast.error('Contract service tidak tersedia');
      return;
    }

    try {
      setLoading(true);
      toast.info('Menginisialisasi kontrak...');
      
      await contractService.initializeContracts();
      
      toast.success('Kontrak berhasil diinisialisasi!');
      setContractsInitialized(true);
    } catch (error: any) {
      console.error('Error initializing contracts:', error);
      toast.error(`Gagal menginisialisasi kontrak: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
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
      if (error.message.includes('Validator contract belum diatur')) {
        toast.error('Kontrak validator belum diatur. Silakan inisialisasi kontrak terlebih dahulu.');
      } else {
        toast.error(`Gagal menambahkan validator: ${error.message || 'Unknown error'}`);
      }
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
    if (!contractService) {
      toast.error('Contract service tidak tersedia');
      return;
    }

    const level = contributionLevel[reportId];
    if (!level || level < 1 || level > 5) {
      toast.error('Level kontribusi harus antara 1-5');
      return;
    }

    // Show informative message about smart contract limitation
    toast.error('Fitur ini tidak tersedia: Smart contract saat ini tidak mendukung pengaturan level kontribusi dari UI admin. Fungsi setContributionLevel di RewardManager hanya dapat dipanggil oleh Institusi Contract, tetapi Institusi Contract tidak memiliki fungsi untuk admin mengatur level kontribusi.');
    
    return; // Disable the functionality

    // Additional validation to ensure the report is validated
    const report = validatedReports.find(r => r.id === reportId);
    console.log(`Setting contribution for report ${reportId}:`, report);
    
    if (!report) {
      toast.error('Laporan tidak ditemukan dalam daftar laporan yang tervalidasi');
      return;
    }

    // Check if report exists in validatedReports array - this means it passed isLaporanSudahDivalidasi check
    // Even if validationResult is missing due to fetch error, we should still allow contribution setting
    console.log(`Report ${reportId} validation status in data:`, {
      hasValidationResult: !!report.validationResult,
      validationResult: report.validationResult
    });

    try {
      setLoading(true);
      toast.info('Mengatur level kontribusi...');
      
      // Comprehensive debugging
      console.log(`Starting contribution setting for report ${reportId} with level ${level}`);
      
      // Use debug method to get comprehensive validation info
      const debugInfo = await contractService.debugValidationStatus(reportId);
      console.log('Debug validation info:', debugInfo);
      
      if (!debugInfo.isValidated) {
        toast.error(`Laporan belum divalidasi. Debug info: isValidated=${debugInfo.isValidated}, hasValidationResult=${debugInfo.hasValidationResult}`);
        return;
      }
      
      console.log(`Proceeding to set contribution level for report ${reportId}...`);
      const tx = await contractService.setContributionLevel(reportId, level);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Institution Admin Dashboard
          </h2>
        </div>
        {!contractsInitialized && (
          <Button 
            onClick={handleInitializeContracts}
            className="bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            <Settings className="w-4 h-4 mr-2" />
            Initialize Contracts
          </Button>
        )}
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
                          <p className="text-sm text-muted-foreground">
                            Submitted: {new Date(report.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          report.status === 'Valid' 
                            ? 'bg-green-500 text-white' 
                            : report.status === 'Tidak Valid'
                            ? 'bg-red-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }>
                          {report.status === 'Tidak Valid' ? 'Invalid' : report.status}
                        </Badge>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{report.description}</p>
                      </div>

                      {/* Validation Result Details */}
                      {report.validationResult && (
                        <div className={`p-4 rounded-lg border-l-4 ${
                          report.validationResult.isValid 
                            ? 'bg-green-50 border-green-400' 
                            : 'bg-red-50 border-red-400'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-sm">Validation Details</h5>
                            <span className={`text-xs px-2 py-1 rounded ${
                              report.validationResult.isValid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {report.validationResult.isValid ? 'VALID' : 'INVALID'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Validator: </span>
                              <span className={`font-mono text-gray-800 ${
                                report.validationResult.validator.includes('rusak') || 
                                report.validationResult.validator.includes('unavailable') 
                                  ? 'text-red-600 bg-red-50 px-1 rounded' 
                                  : ''
                              }`}>
                                {report.validationResult.validator}
                              </span>
                            </div>
                            
                            <div>
                              <span className="font-medium text-gray-600">Validation Notes: </span>
                              <div className={`text-gray-800 ${
                                report.validationResult.description.includes('rusak') || 
                                report.validationResult.description.includes('overflow') ||
                                report.validationResult.description.includes('encoding')
                                  ? 'text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-1' 
                                  : ''
                              }`}>
                                {report.validationResult.description}
                                {(report.validationResult.description.includes('rusak') || 
                                  report.validationResult.description.includes('overflow') ||
                                  report.validationResult.description.includes('encoding')) && (
                                  <div className="text-xs text-amber-600 mt-1">
                                    ⚠️ Data validation mengalami masalah encoding - laporan tetap valid
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-gray-600">Validated on: </span>
                              <span className="text-gray-800">
                                {report.validationResult.validationTimestamp > 0 
                                  ? new Date(report.validationResult.validationTimestamp * 1000).toLocaleString()
                                  : 'Timestamp tidak tersedia'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
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
                            disabled={true}
                          />
                          <Button 
                            onClick={() => handleSetContribution(report.id)}
                            size="sm"
                            disabled={true}
                            variant="secondary"
                          >
                            Set Contribution
                          </Button>
                        </div>
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                          ⚠️ Fitur pengaturan level kontribusi tidak tersedia karena keterbatasan smart contract saat ini
                        </div>
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
