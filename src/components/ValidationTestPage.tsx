import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Clock, 
  FileText, 
  Shield,
  Bug,
  Search,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { toast } from 'sonner';

interface ValidationResult {
  isValid: boolean;
  description: string;
  validator: string;
  validationTimestamp: number;
  hasError?: boolean;
  errorType?: string;
}

interface ReportValidationData {
  reportId: number;
  title: string;
  description: string;
  status: string;
  reporter: string;
  creationTimestamp: number;
  validation?: ValidationResult;
  debugInfo?: any;
}

const ValidationDetailCard: React.FC<{ validation: ValidationResult }> = ({ validation }) => {
  const getValidatorDisplayText = (validator: string) => {
    if (!validator || validator === '0x0000000000000000000000000000000000000000') {
      return 'Validator tidak tersedia';
    }
    if (validator.includes('rusak') || validator.includes('unavailable') || validator.includes('corrupted')) {
      return validator;
    }
    if (validator.length === 42 && validator.startsWith('0x')) {
      return `${validator.substring(0, 6)}...${validator.substring(38)}`;
    }
    return validator;
  };

  const getTimestampDisplay = (timestamp: number) => {
    if (!timestamp || timestamp === 0) {
      return 'Waktu tidak tersedia';
    }
    try {
      return new Date(timestamp * 1000).toLocaleString('id-ID');
    } catch {
      return 'Format waktu tidak valid';
    }
  };

  const hasDataIssues = validation.hasError || 
    validation.validator.includes('rusak') || 
    validation.validator.includes('overflow') ||
    validation.description.includes('rusak') ||
    validation.description.includes('overflow') ||
    validation.description.includes('encoding');

  return (
    <Card className={`border-l-4 ${
      hasDataIssues 
        ? 'border-l-amber-400 bg-amber-50' 
        : validation.isValid 
          ? 'border-l-green-400 bg-green-50' 
          : 'border-l-red-400 bg-red-50'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            {hasDataIssues ? (
              <Bug className="w-5 h-5 text-amber-600" />
            ) : validation.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Detail Validasi
          </span>
          <Badge 
            variant={hasDataIssues ? 'secondary' : validation.isValid ? 'default' : 'destructive'}
            className={
              hasDataIssues 
                ? 'bg-amber-100 text-amber-800' 
                : validation.isValid 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
            }
          >
            {hasDataIssues ? 'DATA ISSUES' : validation.isValid ? 'VALID' : 'TIDAK VALID'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasDataIssues && (
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Peringatan Data:</strong> Terdapat masalah dalam decoding data validasi dari blockchain. 
                Laporan tetap valid, namun detail lengkap tidak dapat ditampilkan dengan sempurna.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Validator</p>
                <p className={`text-sm font-mono break-all ${
                  validation.validator.includes('rusak') || validation.validator.includes('unavailable')
                    ? 'text-amber-700 bg-amber-50 px-2 py-1 rounded' 
                    : 'text-gray-800'
                }`}>
                  {getValidatorDisplayText(validation.validator)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Waktu Validasi</p>
                <p className="text-sm text-gray-800">
                  {getTimestampDisplay(validation.validationTimestamp)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Catatan Validasi</p>
                <div className={`text-sm p-3 rounded-lg border ${
                  validation.description.includes('rusak') || 
                  validation.description.includes('overflow') ||
                  validation.description.includes('encoding')
                    ? 'bg-amber-50 border-amber-200 text-amber-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                  {validation.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {validation.errorType && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Error Type:</strong> {validation.errorType}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ValidationTestPage: React.FC = () => {
  const { contractService, address } = useWallet();
  const [validatedReports, setValidatedReports] = useState<ReportValidationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<number>(1);
  const [debugMode, setDebugMode] = useState(false);

  const loadValidatedReports = async () => {
    if (!contractService) {
      toast.error('Contract service tidak tersedia');
      return;
    }

    setLoading(true);
    try {
      console.log(`Loading validated reports for institution ${selectedInstitution}...`);
      
      const totalReports = await contractService.getLaporanCount();
      console.log(`Total reports in system: ${totalReports}`);
      
      const validatedReportsList: ReportValidationData[] = [];

      for (let i = 1; i <= totalReports; i++) {
        try {
          // Ambil data laporan
          const laporan = await contractService.getLaporan(i);
          console.log(`Report ${i} data:`, laporan);

          // Cek apakah laporan belongs to selected institution
          if (Number(laporan.institusiId) !== selectedInstitution) {
            continue;
          }

          // Cek apakah sudah divalidasi
          const isValidated = await contractService.isLaporanSudahDivalidasi(i);
          console.log(`Report ${i} validation status:`, isValidated);

          if (!isValidated) {
            continue;
          }

          // Cek banding status
          const isAppeal = await contractService.isBanding(i);
          if (isAppeal) {
            continue; // Skip appeals for this view
          }

          const reportData: ReportValidationData = {
            reportId: Number(laporan.laporanId),
            title: laporan.judul,
            description: laporan.deskripsi,
            status: laporan.status,
            reporter: laporan.pelapor,
            creationTimestamp: Number(laporan.creationTimestamp)
          };

          // Ambil data validasi dengan enhanced error handling
          try {
            console.log(`Fetching validation result for report ${i}...`);
            const validationResult = await contractService.getHasilValidasi(i);
            console.log(`Validation result for report ${i}:`, validationResult);

            if (validationResult) {
              const hasDataIssues = 
                validationResult.validator === '0x0000000000000000000000000000000000000060' ||
                validationResult.validator.includes('rusak') ||
                validationResult.validator.includes('unavailable') ||
                validationResult.deskripsi?.includes('rusak') ||
                validationResult.deskripsi?.includes('overflow') ||
                validationResult.deskripsi?.includes('encoding');

              reportData.validation = {
                isValid: Boolean(validationResult.isValid),
                description: validationResult.deskripsi || `Laporan ${i} telah divalidasi - Detail tidak tersedia`,
                validator: validationResult.validator || '0x0000000000000000000000000000000000000000',
                validationTimestamp: Number(validationResult.timestamp) || 0,
                hasError: hasDataIssues,
                errorType: hasDataIssues ? 'ABI_DECODING_ISSUE' : undefined
              };

              // Jika debug mode aktif, tambahkan debug info
              if (debugMode) {
                try {
                  const debugInfo = await contractService.debugValidationStatus(i);
                  reportData.debugInfo = debugInfo;
                } catch (debugError) {
                  console.warn(`Debug info failed for report ${i}:`, debugError);
                }
              }
            } else {
              // Fallback jika tidak ada data validasi
              reportData.validation = {
                isValid: true, // Kita tahu laporan sudah divalidasi
                description: `Laporan ${i} telah divalidasi - Data tidak dapat diambil dari kontrak`,
                validator: 'Data tidak tersedia',
                validationTimestamp: 0,
                hasError: true,
                errorType: 'VALIDATION_DATA_FETCH_FAILED'
              };
            }

            validatedReportsList.push(reportData);
            
          } catch (validationError) {
            console.error(`Error fetching validation for report ${i}:`, validationError);
            
            // Masih tambahkan laporan dengan error info
            reportData.validation = {
              isValid: true, // Kita tahu dari isLaporanSudahDivalidasi bahwa laporan valid
              description: `Error mengambil detail validasi: ${validationError.message}`,
              validator: 'Error saat mengambil data',
              validationTimestamp: 0,
              hasError: true,
              errorType: 'FETCH_ERROR'
            };

            validatedReportsList.push(reportData);
          }

        } catch (reportError) {
          console.error(`Error loading report ${i}:`, reportError);
        }
      }

      console.log(`Loaded ${validatedReportsList.length} validated reports`);
      setValidatedReports(validatedReportsList);
      
      if (validatedReportsList.length === 0) {
        toast.info(`Tidak ada laporan tervalidasi untuk institusi ${selectedInstitution}`);
      } else {
        toast.success(`Berhasil memuat ${validatedReportsList.length} laporan tervalidasi`);
      }

    } catch (error) {
      console.error('Error loading validated reports:', error);
      toast.error(`Gagal memuat laporan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDebugReport = async (reportId: number) => {
    if (!contractService) return;

    try {
      console.log(`=== DEBUGGING REPORT ${reportId} ===`);
      await contractService.debugValidationDataIssues(reportId);
      toast.info(`Debug info untuk laporan ${reportId} telah dicetak ke console`);
    } catch (error) {
      console.error('Debug failed:', error);
      toast.error('Debug gagal');
    }
  };

  useEffect(() => {
    if (contractService) {
      loadValidatedReports();
    }
  }, [contractService, selectedInstitution]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Validation Test Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Testing dan debugging validation data dari blockchain
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setDebugMode(!debugMode)}
            className={debugMode ? 'bg-blue-50 text-blue-700' : ''}
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug Mode {debugMode ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={loadValidatedReports} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filter Institusi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Institution ID:</label>
            <select 
              value={selectedInstitution} 
              onChange={(e) => setSelectedInstitution(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(id => (
                <option key={id} value={id}>Institution {id}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Memuat data validasi...</p>
          </div>
        ) : validatedReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak Ada Laporan Tervalidasi
              </h3>
              <p className="text-gray-600">
                Belum ada laporan yang tervalidasi untuk institusi {selectedInstitution}
              </p>
            </CardContent>
          </Card>
        ) : (
          validatedReports.map((report) => (
            <Card key={report.reportId} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">
                      {report.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">ID:</span> {report.reportId}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {report.reporter.substring(0, 6)}...{report.reporter.substring(38)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(report.creationTimestamp * 1000).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={report.status === 'Valid' ? 'default' : report.status === 'Tidak Valid' ? 'destructive' : 'secondary'}
                    >
                      {report.status}
                    </Badge>
                    {debugMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDebugReport(report.reportId)}
                      >
                        <Bug className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Deskripsi Laporan</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>

                {report.validation && (
                  <ValidationDetailCard validation={report.validation} />
                )}

                {debugMode && report.debugInfo && (
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Debug Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-64">
                        {JSON.stringify(report.debugInfo, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ValidationTestPage;