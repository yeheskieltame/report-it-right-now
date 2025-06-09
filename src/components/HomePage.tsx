import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Shield, FileText, Plus, Crown, User, Coins, TrendingUp, Star } from 'lucide-react';
import CreateInstitutionModal from './modals/CreateInstitutionModal';

interface UserInstitution {
  institusiId: number;
  name: string;
  role: 'admin' | 'validator' | 'pelapor';
  treasury: string;
}

interface PlatformStats {
  totalInstitutions: number;
  totalReports: number;
  userRTKBalance: string;
  stakedAmount: string;
}

const HomePage: React.FC = () => {
  const { isConnected, address, contractService, role } = useWallet();
  const [userInstitutions, setUserInstitutions] = useState<UserInstitution[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalInstitutions: 0,
    totalReports: 0,
    userRTKBalance: '0',
    stakedAmount: '0'
  });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isConnected && contractService && address) {
      loadUserData();
    }
  }, [isConnected, contractService, address]);

  const loadUserData = async () => {
    if (!contractService || !address) return;
    
    setLoading(true);
    try {
      // Load user institutions
      const institutions: UserInstitution[] = [];
      const institusiCount = await contractService.getInstitusiCount();
      
      for (let i = 1; i <= institusiCount; i++) {
        try {
          const [nama, admin, treasury] = await contractService.getInstitusiData(i);
          
          // Check if user is admin
          if (admin.toLowerCase() === address.toLowerCase()) {
            institutions.push({
              institusiId: i,
              name: nama,
              role: 'admin',
              treasury
            });
          } else {
            // Check if user is validator
            const isValidator = await contractService.isValidator(i, address);
            if (isValidator) {
              institutions.push({
                institusiId: i,
                name: nama,
                role: 'validator',
                treasury
              });
            }
            
            // Check if user is pelapor
            const isPelapor = await contractService.isPelapor(i, address);
            if (isPelapor) {
              institutions.push({
                institusiId: i,
                name: nama,
                role: 'pelapor',
                treasury
              });
            }
          }
        } catch (error) {
          console.log(`Error loading institution ${i}:`, error);
        }
      }
      
      // Load platform statistics
      const [rtkBalance, laporanCount, stakedAmount] = await Promise.all([
        contractService.getRTKBalance(address),
        contractService.getLaporanCount(),
        contractService.getStakedAmount(address)
      ]);

      setUserInstitutions(institutions);
      setPlatformStats({
        totalInstitutions: institusiCount,
        totalReports: laporanCount,
        userRTKBalance: rtkBalance,
        stakedAmount: stakedAmount
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-5 h-5" />;
      case 'validator': return <Shield className="w-5 h-5" />;
      case 'pelapor': return <FileText className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'from-purple-500 to-pink-500';
      case 'validator': return 'from-green-500 to-emerald-500';
      case 'pelapor': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const handleInstitutionSelect = (institusiId: number, role: string) => {
    localStorage.setItem('selectedInstitution', institusiId.toString());
    localStorage.setItem('selectedRole', role);
    window.location.reload();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardContent className="p-16 text-center">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-32 h-32 mx-auto blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-32 h-32 mx-auto flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-white" />
                </div>
              </div>
              
              <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Decentralized Reporting
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-2xl mx-auto">
                Platform pelaporan berbasis blockchain yang menjamin transparansi, akuntabilitas, dan kepercayaan dalam tata kelola institusi.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="bg-blue-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Keamanan Blockchain</h3>
                  <p className="text-gray-400">Data tersimpan aman dengan teknologi blockchain yang tidak dapat diubah</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Validasi Publik</h3>
                  <p className="text-gray-400">Setiap laporan divalidasi oleh validator terpercaya</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="bg-purple-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Rekam Jejak Permanen</h3>
                  <p className="text-gray-400">Semua aktivitas tercatat permanen dan dapat diaudit</p>
                </div>
              </div>
              
              <div className="text-lg text-gray-400">
                Hubungkan wallet Anda untuk memulai
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-20 h-20 blur-lg opacity-30"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Utama
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih institusi untuk melanjutkan atau buat institusi baru untuk memulai.
          </p>
        </div>

        {/* Super Admin Badge */}
        {role === 'owner' && (
          <div className="mb-8 text-center">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 text-lg shadow-lg">
              <Crown className="w-6 h-6 mr-2" />
              Super Administrator
            </Badge>
          </div>
        )}

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Institusi</p>
                  <p className="text-2xl font-bold">{platformStats.totalInstitutions}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Laporan</p>
                  <p className="text-2xl font-bold">{platformStats.totalReports}</p>
                </div>
                <FileText className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">RTK Balance</p>
                  <p className="text-2xl font-bold">{parseFloat(platformStats.userRTKBalance).toFixed(2)}</p>
                </div>
                <Coins className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Staked Amount</p>
                  <p className="text-2xl font-bold">{parseFloat(platformStats.stakedAmount).toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Institutions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Institusi Anda
              </h2>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Baru
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userInstitutions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userInstitutions.map((institution) => (
                  <Card 
                    key={`${institution.institusiId}-${institution.role}`}
                    className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 group"
                    onClick={() => handleInstitutionSelect(institution.institusiId, institution.role)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {institution.name}
                        </CardTitle>
                        <Badge className={`bg-gradient-to-r ${getRoleColor(institution.role)} text-white shadow-md`}>
                          {getRoleIcon(institution.role)}
                          <span className="ml-1 capitalize">{institution.role}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">ID:</span>
                          <span>#{institution.institusiId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Treasury:</span>
                          <span className="font-mono text-xs truncate">{institution.treasury}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg group-hover:shadow-xl transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstitutionSelect(institution.institusiId, institution.role);
                        }}
                      >
                        Masuk sebagai {institution.role}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm text-center py-16 shadow-lg">
                <CardContent>
                  <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Belum Terdaftar di Institusi</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Anda belum terdaftar di institusi manapun. Buat institusi baru atau minta admin untuk menambahkan Anda.
                  </p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Buat Institusi Pertama
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Star className="w-5 h-5" />
                  Aksi Cepat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-blue-50 border-blue-200"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Institusi
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-green-50 border-green-200"
                  onClick={loadUserData}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>

            {/* Role Summary */}
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Ringkasan Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['admin', 'validator', 'pelapor'].map(roleType => {
                    const count = userInstitutions.filter(i => i.role === roleType).length;
                    return (
                      <div key={roleType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(roleType)}
                          <span className="capitalize">{roleType}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Development Tools Section */}
        {isConnected && (
          <Card className="mb-12 bg-gradient-to-r from-slate-100 to-gray-100 border-2 border-dashed border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Shield className="w-5 h-5" />
                Development & Analysis Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-blue-50 border-blue-200"
                  onClick={() => window.location.hash = '#analysis'}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Analisis Struct Validasi
                  <Badge variant="secondary" className="ml-auto">New</Badge>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-green-50 border-green-200"
                  onClick={() => window.location.hash = '#test'}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Test Validation Display
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Tools untuk menguji dan menganalisis data validasi dari blockchain dengan fokus pada struct Validasi (validator, isValid, deskripsi).
              </p>
            </CardContent>
          </Card>
        )}

      </div>

      <CreateInstitutionModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadUserData}
      />
    </div>
  );
};

export default HomePage;
