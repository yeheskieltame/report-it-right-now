import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, FileText, Scale, AlertCircle, Settings, CheckCircle, XCircle, Bug, Shield, Clock, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Cell, 
  LineChart, 
  Line,
  Pie
} from 'recharts';

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
    hasDataIssues?: boolean;
    errorType?: string;
  };
}

// New interface for analytics
interface ValidationAnalytics {
  totalReports: number;
  validReports: number;
  invalidReports: number;
  pendingReports: number;
  validationRate: number;
  validatorPerformance: {
    validator: string;
    totalValidations: number;
    validCount: number;
    invalidCount: number;
  }[];
  monthlyStats: {
    month: string;
    valid: number;
    invalid: number;
    total: number;
  }[];
}

// Enhanced Validation Detail Card Component
const ValidationDetailCard: React.FC<{ 
  validationResult: ReportData['validationResult'], 
  reportId: number 
}> = ({ validationResult, reportId }) => {
  if (!validationResult) return null;

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

  const hasDataIssues = validationResult.hasDataIssues || 
    validationResult.validator.includes('rusak') || 
    validationResult.validator.includes('overflow') ||
    validationResult.description.includes('rusak') ||
    validationResult.description.includes('overflow') ||
    validationResult.description.includes('encoding');

  return (
    <div className={`p-4 rounded-lg border-l-4 ${
      hasDataIssues 
        ? 'bg-amber-50 border-amber-400' 
        : validationResult.isValid 
          ? 'bg-green-50 border-green-400' 
          : 'bg-red-50 border-red-400'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {hasDataIssues ? (
            <Bug className="w-4 h-4 text-amber-600" />
          ) : validationResult.isValid ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <h5 className="font-semibold text-sm">Detail Validasi</h5>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          hasDataIssues 
            ? 'bg-amber-100 text-amber-800' 
            : validationResult.isValid 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
        }`}>
          {hasDataIssues ? 'DATA ISSUES' : validationResult.isValid ? 'VALID' : 'INVALID'}
        </span>
      </div>

      {hasDataIssues && (
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>Peringatan:</strong> Terdapat masalah dalam decoding data validasi dari blockchain. 
              Laporan tetap valid, namun detail lengkap tidak dapat ditampilkan dengan sempurna.
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-gray-600 block mb-1">Validator:</span>
              <span className={`font-mono break-all ${
                validationResult.validator.includes('rusak') || validationResult.validator.includes('unavailable')
                  ? 'text-amber-700 bg-amber-50 px-2 py-1 rounded' 
                  : 'text-gray-800'
              }`}>
                {getValidatorDisplayText(validationResult.validator)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-gray-600 block mb-1">Waktu Validasi:</span>
              <span className="text-gray-800">
                {getTimestampDisplay(validationResult.validationTimestamp)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-gray-600 block mb-1">Catatan Validasi:</span>
              <div className={`p-3 rounded-lg border text-sm ${
                validationResult.description.includes('rusak') || 
                validationResult.description.includes('overflow') ||
                validationResult.description.includes('encoding')
                  ? 'bg-amber-50 border-amber-200 text-amber-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                {validationResult.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {validationResult.errorType && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            <strong>Error Type:</strong> {validationResult.errorType}
          </p>
        </div>
      )}
    </div>
  );
};

// New Analytics Card Component
const AnalyticsOverview: React.FC<{ analytics: ValidationAnalytics }> = ({ analytics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Stats Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalReports}</div>
          <p className="text-xs text-muted-foreground">
            All submitted reports
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valid Reports</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{analytics.validReports}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.totalReports > 0 ? 
              `${((analytics.validReports / analytics.totalReports) * 100).toFixed(1)}% of total` : 
              '0% of total'
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invalid Reports</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{analytics.invalidReports}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.totalReports > 0 ? 
              `${((analytics.invalidReports / analytics.totalReports) * 100).toFixed(1)}% of total` : 
              '0% of total'
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Validation Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {analytics.validationRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Reports processed
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// New Chart Components
const ValidationStatusChart: React.FC<{ analytics: ValidationAnalytics }> = ({ analytics }) => {
  const pieData = [
    { name: 'Valid', value: analytics.validReports, color: '#10B981' },
    { name: 'Invalid', value: analytics.invalidReports, color: '#EF4444' },
    { name: 'Pending', value: analytics.pendingReports, color: '#F59E0B' }
  ];

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Validation Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const ValidatorPerformanceChart: React.FC<{ analytics: ValidationAnalytics }> = ({ analytics }) => {
  const chartData = analytics.validatorPerformance.map(validator => ({
    validator: `${validator.validator.substring(0, 6)}...${validator.validator.substring(38)}`,
    fullAddress: validator.validator,
    valid: validator.validCount,
    invalid: validator.invalidCount,
    total: validator.totalValidations
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Validator Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="validator" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'valid' ? 'Valid' : 'Invalid']}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? `Validator: ${data.fullAddress}` : label;
                }}
              />
              <Bar dataKey="valid" stackId="a" fill="#10B981" name="Valid" />
              <Bar dataKey="invalid" stackId="a" fill="#EF4444" name="Invalid" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const MonthlyTrendsChart: React.FC<{ analytics: ValidationAnalytics }> = ({ analytics }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Monthly Validation Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="valid" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Valid Reports"
              />
              <Line 
                type="monotone" 
                dataKey="invalid" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Invalid Reports"
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Total Reports"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [analytics, setAnalytics] = useState<ValidationAnalytics>({
    totalReports: 0,
    validReports: 0,
    invalidReports: 0,
    pendingReports: 0,
    validationRate: 0,
    validatorPerformance: [],
    monthlyStats: []
  });
  const [reportFilter, setReportFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  // Get current institution ID from localStorage
  const selectedInstitution = localStorage.getItem('selectedInstitution');
  const institusiId = selectedInstitution ? parseInt(selectedInstitution) : 0;

  useEffect(() => {
    if (contractService && institusiId > 0) {
      loadInstitutionData();
    }
  }, [contractService, institusiId]);

  // New method to calculate analytics
  const calculateAnalytics = async () => {
    if (!contractService) return;

    try {
      console.log('Calculating analytics for institution:', institusiId);
      
      const totalReports = await contractService.getLaporanCount();
      let validCount = 0;
      let invalidCount = 0;
      let pendingCount = 0;
      
      const validatorPerformanceMap = new Map<string, {
        validCount: number;
        invalidCount: number;
        totalValidations: number;
      }>();
      
      const monthlyStatsMap = new Map<string, {
        valid: number;
        invalid: number;
        total: number;
      }>();

      // Analyze each report
      for (let i = 1; i <= totalReports; i++) {
        try {
          const laporan = await contractService.getLaporan(i);
          
          // Only include reports from this institution
          if (Number(laporan.institusiId) !== institusiId) {
            continue;
          }

          // Get month for trends
          const reportDate = new Date(Number(laporan.creationTimestamp) * 1000);
          const monthKey = reportDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          
          if (!monthlyStatsMap.has(monthKey)) {
            monthlyStatsMap.set(monthKey, { valid: 0, invalid: 0, total: 0 });
          }
          const monthStats = monthlyStatsMap.get(monthKey)!;
          monthStats.total++;

          // Check validation status
          const isValidated = await contractService.isLaporanSudahDivalidasi(i);
          
          if (!isValidated) {
            pendingCount++;
            continue;
          }

          // Get validation status directly from report status field
          const reportStatus = laporan.status;
          console.log(`Report ${i} status from getLaporan: ${reportStatus}`);
          
          if (reportStatus === 'Valid') {
            validCount++;
            monthStats.valid++;
          } else if (reportStatus === 'Tidak Valid') {
            invalidCount++;
            monthStats.invalid++;
          } else {
            // If status is not clearly Valid or Invalid, try to get from validation result
            try {
              const validationResult = await contractService.getEnhancedValidationResult(i);
              
              if (validationResult?.isValid) {
                validCount++;
                monthStats.valid++;
              } else {
                invalidCount++;
                monthStats.invalid++;
              }
            } catch (validationError) {
              console.warn(`Could not determine validation status for report ${i}:`, validationError);
              // Default to invalid if we can't determine
              invalidCount++;
              monthStats.invalid++;
            }
          }

          // Track validator performance if we can get validation result
          try {
            const validationResult = await contractService.getEnhancedValidationResult(i);
            const validatorAddr = validationResult?.validator;
            if (validatorAddr && validatorAddr !== '0x0000000000000000000000000000000000000000') {
              if (!validatorPerformanceMap.has(validatorAddr)) {
                validatorPerformanceMap.set(validatorAddr, {
                  validCount: 0,
                  invalidCount: 0,
                  totalValidations: 0
                });
              }
              
              const performance = validatorPerformanceMap.get(validatorAddr)!;
              performance.totalValidations++;
              
              // Use report status for counting validator performance
              if (reportStatus === 'Valid') {
                performance.validCount++;
              } else if (reportStatus === 'Tidak Valid') {
                performance.invalidCount++;
              } else if (validationResult.isValid) {
                performance.validCount++;
              } else {
                performance.invalidCount++;
              }
            }
          } catch (validationError) {
            console.warn(`Could not get validator info for report ${i}:`, validationError);
          }
        } catch (reportError) {
          console.warn(`Could not load report ${i}:`, reportError);
        }
      }

      const institutionTotal = validCount + invalidCount + pendingCount;
      const validationRate = institutionTotal > 0 ? ((validCount + invalidCount) / institutionTotal) * 100 : 0;

      // Convert validator performance map to array
      const validatorPerformance = Array.from(validatorPerformanceMap.entries()).map(([validator, stats]) => ({
        validator,
        totalValidations: stats.totalValidations,
        validCount: stats.validCount,
        invalidCount: stats.invalidCount
      }));

      // Convert monthly stats to array and sort by date
      const monthlyStats = Array.from(monthlyStatsMap.entries())
        .map(([month, stats]) => ({ month, ...stats }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6); // Last 6 months

      const newAnalytics: ValidationAnalytics = {
        totalReports: institutionTotal,
        validReports: validCount,
        invalidReports: invalidCount,
        pendingReports: pendingCount,
        validationRate,
        validatorPerformance,
        monthlyStats
      };

      console.log('Calculated analytics:', newAnalytics);
      setAnalytics(newAnalytics);

    } catch (error) {
      console.error('Error calculating analytics:', error);
      toast.error('Failed to calculate analytics');
    }
  };

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
      
      // Load analytics
      await calculateAnalytics();
      
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
    
    const desc = String(deskripsi).trim();
    
    // Check for empty descriptions
    if (desc.length === 0) {
      return `Laporan ${reportId} telah divalidasi - Deskripsi kosong`;
    }
    
    // Check for corruption indicators
    if (desc.includes('encoding error') || desc.includes('hex encoding error')) {
      return `Laporan ${reportId} telah divalidasi (masalah encoding data)`;
    }
    
    if (desc.includes('tidak dapat dibaca') || desc.includes('tidak dapat mengambil detail')) {
      return `Laporan ${reportId} telah divalidasi (detail tidak dapat diambil dari kontrak)`;
    }
    
    if (desc.includes('ABI overflow')) {
      return `Laporan ${reportId} telah divalidasi (data rusak karena ABI overflow)`;
    }
    
    // Check for hex strings or other corruption
    if (desc.includes('0x') || desc.includes('overflow')) {
      console.warn(`Corrupted description detected for report ${reportId}:`, desc);
      return `Laporan ${reportId} telah divalidasi (data rusak)`;
    }
    
    // Return cleaned description, truncated if too long
    return desc.length > 200 ? desc.substring(0, 197) + '...' : desc;
  };

  const cleanValidatorAddress = (validator: any): string => {
    if (!validator) {
      return 'Validator tidak diketahui';
    }
    
    const addr = String(validator).toLowerCase();
    
    // Check for null address
    if (addr === '0x0000000000000000000000000000000000000000') {
      return 'Alamat validator tidak tersedia';
    }
    
    // Check for other known corrupted addresses (the specific one we've been seeing)
    if (addr === '0x0000000000000000000000000000000000000060' || 
        addr.length !== 42 || 
        !addr.startsWith('0x') ||
        !/^0x[a-f0-9]{40}$/.test(addr)) {
      console.warn(`Invalid validator address detected:`, addr);
      return 'Alamat validator rusak (ABI overflow)';
    }
    
    // Return properly formatted address
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
    const errorMsg = error?.message || '';
    
    if (errorMsg.includes('has not been validated')) {
      return `Laporan ${reportId} belum divalidasi`;
    } else if (errorMsg.includes('Failed to get validation result')) {
      return `Laporan ${reportId} - Gagal mengambil hasil validasi dari kontrak`;
    } else if (errorMsg.includes('Contract error')) {
      return `Laporan ${reportId} - Error kontrak saat mengambil data validasi`;
    } else if (errorMsg.includes('overflow')) {
      return `Laporan ${reportId} - Data validasi rusak karena ABI overflow error`;
    } else if (errorMsg.includes('ABI')) {
      return `Laporan ${reportId} - Kesalahan decoding ABI pada data validasi`;
    } else if (errorMsg.includes('revert')) {
      return `Laporan ${reportId} - Smart contract mengembalikan error`;
    } else {
      return `Laporan ${reportId} - Error: ${errorMsg || 'Unknown error'}`;
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
                // Create base validation data using report status
                const reportStatus = laporan.status;
                console.log(`Report ${i} status from data: ${reportStatus}`);
                
                let baseValidationData = {
                  isValid: reportStatus === 'Valid', // Use report status as primary source
                  description: `Laporan ${i} - Status: ${reportStatus}`,
                  validator: '0x0000000000000000000000000000000000000000',
                  validationTimestamp: Number(laporan.creationTimestamp),
                  hasDataIssues: false,
                  errorType: undefined
                };

                // Try to get additional validation details from validator contract
                try {
                  const validationResult = await contractService.getEnhancedValidationResult(i);
                  console.log(`Report ${i} validation result:`, validationResult);
                  
                  // If debugging is needed (for corrupted data), run debug analysis
                  if (!validationResult || 
                      validationResult.validator === '0x0000000000000000000000000000000000000060' ||
                      (validationResult.deskripsi && validationResult.deskripsi.includes('overflow'))) {
                    console.warn(`Report ${i} has corrupted validation data, running debug analysis...`);
                    await contractService.debugValidationDataIssues(i);
                  }
                  
                  // Enhance the base data with validator contract details (but keep report status as primary)
                  if (validationResult) {
                    const hasDataIssues = !validationResult || 
                        validationResult.validator === '0x0000000000000000000000000000000000000060' ||
                        (validationResult.deskripsi && validationResult.deskripsi.includes('overflow')) ||
                        validationResult.validator?.includes('rusak') ||
                        validationResult.validator?.includes('unavailable') ||
                        validationResult.deskripsi?.includes('rusak') ||
                        validationResult.deskripsi?.includes('encoding');

                    baseValidationData = {
                      isValid: reportStatus === 'Valid', // Keep using report status as primary
                      description: cleanValidationDescription(validationResult?.deskripsi, i) || baseValidationData.description,
                      validator: cleanValidatorAddress(validationResult?.validator) || baseValidationData.validator,
                      validationTimestamp: cleanTimestamp(validationResult?.timestamp) || baseValidationData.validationTimestamp,
                      hasDataIssues: hasDataIssues,
                      errorType: hasDataIssues ? 'ABI_DECODING_ISSUE' : undefined
                    };
                  }
                } catch (validationError) {
                  console.error(`Error getting validation details for report ${i}:`, validationError);
                  
                  // Run comprehensive debugging for this report
                  try {
                    await contractService.debugValidationDataIssues(i);
                  } catch (debugError) {
                    console.error(`Debug analysis failed for report ${i}:`, debugError);
                  }
                  
                  // Keep the base validation data with error info
                  baseValidationData.description = `${baseValidationData.description} - Detail dari validator tidak dapat diambil: ${getValidationErrorMessage(validationError, i)}`;
                  baseValidationData.hasDataIssues = true;
                  baseValidationData.errorType = 'VALIDATION_FETCH_ERROR';
                }
                
                // Enhance report data with validation details
                const enhancedReportData = {
                  ...reportData,
                  validationResult: baseValidationData
                };
                
                validatedReportsList.push(enhancedReportData);
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
          {/* Analytics Overview */}
          <AnalyticsOverview analytics={analytics} />
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ValidationStatusChart analytics={analytics} />
            <ValidatorPerformanceChart analytics={analytics} />
          </div>
          
          {/* Monthly Trends */}
          <MonthlyTrendsChart analytics={analytics} />

          {/* Institution Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Institution Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Institution Name</Label>
                <p className="text-lg">{institutionData?.nama || 'Loading...'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Admin Address</Label>
                <p className="text-sm font-mono">{institutionData?.admin || 'Loading...'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Treasury Address</Label>
                <p className="text-sm font-mono">{institutionData?.treasury || 'Loading...'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Active Validators</Label>
                <p className="text-lg">{validators.filter(v => v.isActive).length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => calculateAnalytics()} disabled={loading}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Refresh Analytics
                </Button>
                <Button 
                  onClick={handleInitializeContracts} 
                  disabled={loading || contractsInitialized}
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {contractsInitialized ? 'Contracts Initialized' : 'Initialize Contracts'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Legacy Institution Info for backwards compatibility */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ...existing code... */}
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Validated Reports</span>
                  <Badge variant="outline" className="ml-2">
                    {validatedReports.length} Total
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Filter:</Label>
                  <Select 
                    value={reportFilter}
                    onValueChange={(value: 'all' | 'valid' | 'invalid') => setReportFilter(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Pilih filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          Semua Laporan
                        </div>
                      </SelectItem>
                      <SelectItem value="valid">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Valid Saja
                        </div>
                      </SelectItem>
                      <SelectItem value="invalid">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Invalid Saja
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading reports...</p>
                ) : (() => {
                  // Filter reports based on status from laporan.status field
                  const filteredReports = validatedReports.filter(report => {
                    if (reportFilter === 'all') return true;
                    if (reportFilter === 'valid') return report.status === 'Valid';
                    if (reportFilter === 'invalid') return report.status === 'Tidak Valid';
                    return false;
                  });

                  // Show filter statistics
                  const filterStats = (
                    <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <span className="font-medium">
                          Menampilkan {filteredReports.length} dari {validatedReports.length} laporan
                        </span>
                        {reportFilter !== 'all' && (
                          <span className="ml-2">
                            (Filter: {reportFilter === 'valid' ? 'Laporan Valid' : 'Laporan Invalid'})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs text-blue-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Valid: {validatedReports.filter(r => r.status === 'Valid').length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Invalid: {validatedReports.filter(r => r.status === 'Tidak Valid').length}</span>
                        </div>
                      </div>
                    </div>
                  );

                  if (filteredReports.length === 0) {
                    const filterText = reportFilter === 'all' ? 'reports' : 
                                     reportFilter === 'valid' ? 'valid reports' : 'invalid reports';
                    return (
                      <>
                        {filterStats}
                        <p className="text-muted-foreground text-center py-8">
                          No {filterText} found
                        </p>
                      </>
                    );
                  }

                  return (
                    <>
                      {filterStats}
                      {filteredReports.map((report) => (
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

                      {/* Enhanced Validation Result Details */}
                      {report.validationResult && (
                        <ValidationDetailCard validationResult={report.validationResult} reportId={report.id} />
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
                  ))}
                    </>
                  );
                })()}
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
