import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Database, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Shield,
  Microscope
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { toast } from 'sonner';
import ValidationStructDisplay from './ValidationStructDisplay';

const ValidationAnalysisPage: React.FC = () => {
  const { contractService, address } = useWallet();
  const [reportId, setReportId] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [validationData, setValidationData] = useState<any>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Load all available reports
  const loadAvailableReports = async () => {
    if (!contractService) return;

    setLoading(true);
    try {
      const totalReports = await contractService.getLaporanCount();
      const reportsList = [];

      for (let i = 1; i <= Math.min(totalReports, 10); i++) { // Limit to first 10 for performance
        try {
          const report = await contractService.getLaporan(i);
          const isValidated = await contractService.isLaporanSudahDivalidasi(i);
          
          reportsList.push({
            id: i,
            judul: report.judul,
            status: report.status,
            isValidated: isValidated,
            pelapor: report.pelapor
          });
        } catch (error) {
          console.log(`Cannot load report ${i}:`, error);
        }
      }

      setReports(reportsList);
      toast.success(`Loaded ${reportsList.length} reports`);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Analyze specific report validation
  const analyzeReport = async (reportIdNum: number) => {
    if (!contractService) return;

    setLoading(true);
    setSelectedReport(reportIdNum);
    
    try {
      console.log(`=== Analyzing Report ${reportIdNum} ===`);
      
      // Check if report is validated first
      const isValidated = await contractService.isLaporanSudahDivalidasi(reportIdNum);
      console.log(`Report ${reportIdNum} validation status:`, isValidated);
      
      if (!isValidated) {
        toast.error(`Report ${reportIdNum} has not been validated yet`);
        setValidationData(null);
        return;
      }

      // Use the new specific method for Validasi struct
      const validasiStruct = await contractService.getValidasiStructData(reportIdNum);
      console.log('Validasi struct data:', validasiStruct);
      
      // Convert to format expected by ValidationStructDisplay
      const convertedData = {
        validator: validasiStruct.validator,
        isValid: validasiStruct.isValid,
        deskripsi: validasiStruct.deskripsi,
        timestamp: validasiStruct.timestamp,
        hasDataIssues: validasiStruct.hasIssues,
        errorType: validasiStruct.hasIssues ? 'DATA_EXTRACTION_ISSUES' : undefined,
        fetchMethod: validasiStruct.dataSource,
        rawData: validasiStruct.rawData
      };
      
      setValidationData(convertedData);
      
      toast.success(`Successfully analyzed report ${reportIdNum} using ${validasiStruct.dataSource}`);
    } catch (error) {
      console.error('Error analyzing report:', error);
      toast.error(`Failed to analyze report: ${error.message}`);
      setValidationData(null);
    } finally {
      setLoading(false);
    }
  };

  // Run comprehensive debug analysis
  const runDebugAnalysis = async (reportIdNum: number) => {
    if (!contractService) return;

    setLoading(true);
    try {
      console.log(`Running debug analysis for report ${reportIdNum}...`);
      await contractService.debugValidationDataIssues(reportIdNum);
      toast.success('Debug analysis completed - check console for details');
    } catch (error) {
      console.error('Debug analysis failed:', error);
      toast.error('Debug analysis failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractService) {
      loadAvailableReports();
    }
  }, [contractService]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Microscope className="w-8 h-8 text-blue-600" />
            Analisis Struct Validasi
          </h1>
          <p className="text-gray-600 mt-2">
            Analisis mendalam data validation dari blockchain dengan fokus pada struct Validasi
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadAvailableReports}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Reports
          </Button>
          <Button
            variant={debugMode ? "default" : "outline"}
            onClick={() => setDebugMode(!debugMode)}
          >
            <Shield className="w-4 h-4 mr-2" />
            Debug Mode
          </Button>
        </div>
      </div>

      {/* Quick Report Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Pilih Laporan untuk Analisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report ID (Manual Input)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  placeholder="Enter report ID..."
                  min="1"
                />
                <Button 
                  onClick={() => analyzeReport(parseInt(reportId))}
                  disabled={loading || !reportId}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Available Reports ({reports.length})</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {reports.map((report) => (
                  <Button
                    key={report.id}
                    variant={selectedReport === report.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => analyzeReport(report.id)}
                    disabled={loading}
                    className="text-left justify-start"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span>#{report.id}</span>
                      {report.isValidated ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      )}
                      <span className="truncate text-xs">
                        {report.judul?.substring(0, 15) || 'No title'}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {debugMode && selectedReport && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Debug Analysis for Report #{selectedReport}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runDebugAnalysis(selectedReport)}
                  disabled={loading}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Run Debug
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Display */}
      {selectedReport && (
        <Tabs defaultValue="validation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="validation">Validation Data</TabsTrigger>
            <TabsTrigger value="technical">Technical Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="validation" className="space-y-4">
            {validationData ? (
              <ValidationStructDisplay
                reportId={selectedReport}
                validationData={validationData}
                showAdvancedDebug={debugMode}
                onRefresh={() => analyzeReport(selectedReport)}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {loading ? 'Loading validation data...' : 'No validation data available'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="technical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Technical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Struct Validasi pada Smart Contract:</strong>
                    <br />
                    <code className="text-sm">
                      struct Validasi {'{'}
                      <br />
                      &nbsp;&nbsp;address validator;
                      <br />
                      &nbsp;&nbsp;bool isValid;
                      <br />
                      &nbsp;&nbsp;string deskripsi;
                      <br />
                      {'}'}
                    </code>
                  </AlertDescription>
                </Alert>

                {validationData && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Raw Validation Data</Label>
                      <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
                        {JSON.stringify(validationData, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Data Extraction Method</Label>
                      <Badge variant="outline" className="mt-2">
                        {validationData.fetchMethod || 'Unknown'}
                      </Badge>
                    </div>

                    {validationData.hasError && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Data Issues Detected:</strong> {validationData.errorType}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Cara Menggunakan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Pilih report ID dari daftar yang tersedia atau input manual</p>
          <p>2. Klik "Analyze" untuk mengambil data struct Validasi dari blockchain</p>
          <p>3. Data akan menampilkan: validator address, isValid status, dan deskripsi</p>
          <p>4. Aktifkan Debug Mode untuk analisis mendalam jika ada masalah data</p>
          <p>5. Periksa Technical Details untuk informasi teknis dan raw data</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationAnalysisPage;
