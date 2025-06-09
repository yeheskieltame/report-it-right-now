import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Database, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Shield,
  Microscope,
  Filter
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
  const [validationFilter, setValidationFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [validationResults, setValidationResults] = useState<Map<number, any>>(new Map());

  // Load all available reports
  const loadAvailableReports = async () => {
    if (!contractService) return;

    setLoading(true);
    try {
      const totalReports = await contractService.getLaporanCount();
      const reportsList = [];
      const validationResultsMap = new Map();

      for (let i = 1; i <= Math.min(totalReports, 10); i++) { // Limit to first 10 for performance
        try {
          const report = await contractService.getLaporan(i);
          const isValidated = await contractService.isLaporanSudahDivalidasi(i);
          
          let validationResult = null;
          if (isValidated) {
            try {
              // Get actual validation result to check isValid
              const validasiStruct = await contractService.getValidasiStructData(i);
              validationResult = {
                isValid: validasiStruct.isValid,
                deskripsi: validasiStruct.deskripsi,
                validator: validasiStruct.validator,
                dataSource: validasiStruct.dataSource
              };
              validationResultsMap.set(i, validationResult);
            } catch (validationError) {
              console.log(`Cannot get validation result for report ${i}:`, validationError);
            }
          }
          
          reportsList.push({
            id: i,
            judul: report.judul,
            status: report.status,
            isValidated: isValidated,
            validationResult: validationResult,
            pelapor: report.pelapor
          });
        } catch (error) {
          console.log(`Cannot load report ${i}:`, error);
        }
      }

      setReports(reportsList);
      setValidationResults(validationResultsMap);
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

  // Filter reports based on validation result (isValid)
  const getFilteredReports = () => {
    if (validationFilter === 'all') {
      return reports;
    } else if (validationFilter === 'valid') {
      // Only show reports that have been validated AND are valid
      return reports.filter(report => report.isValidated && report.validationResult?.isValid === true);
    } else { // 'invalid'
      // Only show reports that have been validated AND are invalid
      return reports.filter(report => report.isValidated && report.validationResult?.isValid === false);
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
          
          {/* Filter Control */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <Select value={validationFilter} onValueChange={(value: 'all' | 'valid' | 'invalid') => setValidationFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({reports.length})</SelectItem>
                <SelectItem value="valid">
                  Valid Results ({reports.filter(r => r.isValidated && r.validationResult?.isValid === true).length})
                </SelectItem>
                <SelectItem value="invalid">
                  Invalid Results ({reports.filter(r => r.isValidated && r.validationResult?.isValid === false).length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quick Report Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Pilih Laporan untuk Analisis
          </CardTitle>
          
          {/* Summary Statistics */}
          {reports.length > 0 && (
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{reports.filter(r => r.isValidated && r.validationResult?.isValid === true).length} Valid Results</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{reports.filter(r => r.isValidated && r.validationResult?.isValid === false).length} Invalid Results</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Shield className="w-4 h-4" />
                <span>{reports.filter(r => !r.isValidated).length} Not Validated</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{reports.length} Total</span>
              </div>
            </div>
          )}
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
              <div className="flex items-center justify-between">
                <Label>Available Reports ({getFilteredReports().length} of {reports.length})</Label>
                
                {/* Quick Filter Buttons */}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={validationFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setValidationFilter('all')}
                    className="text-xs px-2 py-1"
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={validationFilter === 'valid' ? 'default' : 'outline'}
                    onClick={() => setValidationFilter('valid')}
                    className="text-xs px-2 py-1 text-green-600 border-green-200"
                    title="Reports with valid validation results"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Valid
                  </Button>
                  <Button
                    size="sm"
                    variant={validationFilter === 'invalid' ? 'default' : 'outline'}
                    onClick={() => setValidationFilter('invalid')}
                    className="text-xs px-2 py-1 text-amber-600 border-amber-200"
                    title="Reports with invalid validation results"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Invalid
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {getFilteredReports().map((report) => (
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
                      {!report.isValidated ? (
                        <div className="w-3 h-3 rounded-full bg-gray-300" title="Not validated" />
                      ) : report.validationResult?.isValid === true ? (
                        <CheckCircle className="w-3 h-3 text-green-500" title="Valid" />
                      ) : report.validationResult?.isValid === false ? (
                        <AlertTriangle className="w-3 h-3 text-amber-500" title="Invalid" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-blue-300" title="Validated but result unknown" />
                      )}
                      <span className="truncate text-xs">
                        {report.judul?.substring(0, 15) || 'No title'}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
              
              {/* Filter Status Info */}
              {validationFilter !== 'all' && getFilteredReports().length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <Filter className="w-3 h-3 inline mr-1" />
                  Showing {getFilteredReports().length} report(s) with {validationFilter} validation results
                </div>
              )}
              
              {getFilteredReports().length === 0 && reports.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 rounded text-center text-sm text-gray-600">
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                  No reports with {validationFilter} validation results found
                  <br />
                  <button 
                    onClick={() => setValidationFilter('all')}
                    className="text-blue-600 hover:underline text-xs mt-1"
                  >
                    Show all reports
                  </button>
                </div>
              )}
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
          <p>2. Gunakan filter untuk menampilkan laporan Valid, Invalid, atau semua (All)</p>
          <p>3. Klik "Analyze" untuk mengambil data struct Validasi dari blockchain</p>
          <p>4. Data akan menampilkan: validator address, isValid status, dan deskripsi</p>
          <p>5. Aktifkan Debug Mode untuk analisis mendalam jika ada masalah data</p>
          <p>6. Periksa Technical Details untuk informasi teknis dan raw data</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationAnalysisPage;
