import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, User, MessageSquare, Clock, Shield, Eye, RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { ContractService } from '../services/ContractService';
import { toast } from 'sonner';

interface ValidationStruct {
  validator: string;      // address validator (dari struct Validasi)
  isValid: boolean;       // bool isValid (dari struct Validasi)
  deskripsi: string;      // string deskripsi (dari struct Validasi)
  timestamp?: number;     // additional timestamp data
  hasDataIssues?: boolean;
  errorType?: string;
  fetchMethod?: string;
}

interface ValidationStructDisplayProps {
  reportId: number;
  validationData?: ValidationStruct;
  showAdvancedDebug?: boolean;
  onRefresh?: () => void;
}

const ValidationStructDisplay: React.FC<ValidationStructDisplayProps> = ({ 
  reportId, 
  validationData, 
  showAdvancedDebug = false,
  onRefresh 
}) => {
  const { contractService } = useWallet();
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [enhancedValidation, setEnhancedValidation] = useState<ValidationStruct | null>(null);

  // Fetch fresh validation data
  const fetchValidationData = async () => {
    if (!contractService) return;

    setLoading(true);
    try {
      console.log(`Fetching validation data for report ${reportId}...`);
      
      // Use enhanced method to get validation result
      const result = await contractService.getEnhancedValidationResult(reportId);
      console.log('Enhanced validation result:', result);
      
      if (result) {
        setEnhancedValidation({
          validator: result.validator || '0x0000000000000000000000000000000000000000',
          isValid: Boolean(result.isValid),
          deskripsi: result.deskripsi || 'Deskripsi tidak tersedia',
          timestamp: result.timestamp || 0,
          hasDataIssues: result.hasError || false,
          errorType: result.errorType,
          fetchMethod: result.fetchMethod
        });
      }

      // If advanced debug is enabled, get debug data
      if (showAdvancedDebug) {
        const debug = await contractService.debugValidationStatus(reportId);
        setDebugData(debug);
      }

    } catch (error) {
      console.error('Error fetching validation data:', error);
      toast.error(`Gagal mengambil data validasi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!validationData && contractService) {
      fetchValidationData();
    }
  }, [reportId, contractService]);

  const displayData = enhancedValidation || validationData;

  if (!displayData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Data Validasi Laporan #{reportId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Data validasi tidak tersedia</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchValidationData}
                disabled={loading}
                className="mt-4"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {loading ? 'Memuat...' : 'Coba Muat Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValidatorAddress = (address: string) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Tidak tersedia';
    }
    
    if (address.includes('rusak') || address.includes('corrupted')) {
      return address;
    }
    
    if (address.length === 42 && address.startsWith('0x')) {
      return `${address.substring(0, 6)}...${address.substring(38)}`;
    }
    
    return address;
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp || timestamp === 0) {
      return 'Tidak tersedia';
    }
    
    try {
      return new Date(timestamp * 1000).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Format tidak valid';
    }
  };

  const getValidationStatusIcon = () => {
    if (displayData.hasDataIssues) {
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
    return displayData.isValid 
      ? <CheckCircle className="w-5 h-5 text-green-600" />
      : <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getValidationStatusBadge = () => {
    if (displayData.hasDataIssues) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Data Issues</Badge>;
    }
    return displayData.isValid 
      ? <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>
      : <Badge variant="secondary" className="bg-red-100 text-red-800">Tidak Valid</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Struct Validasi - Laporan #{reportId}
          </div>
          <div className="flex items-center gap-2">
            {getValidationStatusBadge()}
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Validation Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Validator Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Validator Address
            </Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono">
                {formatValidatorAddress(displayData.validator)}
              </code>
              {displayData.validator && displayData.validator.length === 42 && (
                <div className="mt-1">
                  <span className="text-xs text-gray-500">
                    Full: {displayData.validator}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              {getValidationStatusIcon()}
              Status Validasi
            </Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {displayData.isValid ? 'VALID' : 'TIDAK VALID'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Boolean value: {displayData.isValid.toString()}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Deskripsi Validasi
          </Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm">
              {displayData.deskripsi || 'Tidak ada deskripsi'}
            </p>
            {displayData.hasDataIssues && (
              <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                ⚠️ Data ini mungkin memiliki masalah encoding atau ABI overflow
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        {displayData.timestamp && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Waktu Validasi
            </Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                {formatTimestamp(displayData.timestamp)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Unix timestamp: {displayData.timestamp}
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        {displayData.fetchMethod && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Metode Pengambilan Data</Label>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Badge variant="outline" className="text-xs">
                {displayData.fetchMethod}
              </Badge>
              {displayData.errorType && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                    {displayData.errorType}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Debug Information */}
        {showAdvancedDebug && debugData && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Debug Information</Label>
            <div className="p-3 bg-gray-100 rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Data Quality Indicators */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Kualitas Data:</span>
            <div className="flex items-center gap-2">
              {displayData.hasDataIssues ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="w-3 h-3" />
                  Memiliki masalah
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Baik
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationStructDisplay;
