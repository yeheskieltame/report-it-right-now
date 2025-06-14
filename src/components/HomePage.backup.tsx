import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Shield, FileText, Plus, Crown, User, Coins, TrendingUp, Star, ArrowRight, CheckCircle, Globe, Clock, Lock, Award, Zap } from 'lucide-react';
import CreateInstitutionModal from './modals/CreateInstitutionModal';
import TokenSaleCard from './TokenSaleCard';

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
  const { t } = useLanguage();
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

  const refreshData = () => {
    if (isConnected && contractService && address) {
      loadUserData();
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Content */}
              <div className="text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  Blockchain-Powered Reporting
                </div>
                
                {/* Hero Title */}
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  <span className="block">Master Governance</span>
                  <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    with Confidence
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                  {t('landing.hero.description')}
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 group"
                  >
                    {t('landing.hero.cta')}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {t('landing.hero.learnMore')}
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">150+</div>
                    <div className="text-sm text-gray-500">Active Institutions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">10K+</div>
                    <div className="text-sm text-gray-500">Reports Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">99.9%</div>
                    <div className="text-sm text-gray-500">Uptime</div>
                  </div>
                </div>
              </div>

              {/* Right Side - MacBook Window */}
              <div className="relative lg:block hidden">
                <div className="relative">
                  {/* MacBook Window */}
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    {/* Window Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="ml-4 text-sm text-gray-500 font-medium">Decentralized Reporting Dashboard</div>
                      </div>
                    </div>
                    
                    {/* Window Content */}
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
                      {/* Dashboard Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Welcome Back!</div>
                            <div className="text-sm text-gray-500">Manage your reports</div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Connected
                        </Badge>
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xl font-bold text-gray-900">24</div>
                              <div className="text-xs text-gray-500">Reports</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Shield className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-xl font-bold text-gray-900">12</div>
                              <div className="text-xs text-gray-500">Validated</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 mb-3">Recent Activity</div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">Report Validated</div>
                              <div className="text-xs text-gray-500">2 minutes ago</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">New Report Submitted</div>
                              <div className="text-xs text-gray-500">5 minutes ago</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-2xl opacity-80 animate-float"></div>
                  <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl opacity-70 animate-float" style={{animationDelay: '2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="relative py-16 bg-gradient-to-r from-purple-50 via-white to-blue-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.stats.title')}</h2>
              <p className="text-gray-600">Trusted by organizations worldwide</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">150+</div>
                  <div className="text-gray-600">{t('landing.stats.institutions')}</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">10K+</div>
                  <div className="text-gray-600">{t('landing.stats.reports')}</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">500+</div>
                  <div className="text-gray-600">{t('landing.stats.validators')}</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">99.9%</div>
                  <div className="text-gray-600">{t('landing.stats.uptime')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                Platform Features
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('landing.features.title')}</h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">{t('landing.features.subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Cards */}
              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.transparency.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('features.transparency.description')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.decentralized.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('features.decentralized.description')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lock className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.immutable.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('features.immutable.description')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.rewards.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('features.rewards.description')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Globe className="w-8 h-8 text-cyan-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.global.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('features.global.description')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('features.realtime.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('features.realtime.description')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-r from-gray-50 via-purple-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                Simple Process
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('landing.howItWorks.title')}</h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">{t('landing.howItWorks.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="relative mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      1
                    </div>
                    {/* Connector line - hidden on mobile */}
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-blue-300"></div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('landing.howItWorks.step1.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('landing.howItWorks.step1.description')}</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="relative mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      2
                    </div>
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-cyan-300"></div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('landing.howItWorks.step2.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('landing.howItWorks.step2.description')}</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="relative mb-6">
                    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      3
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('landing.howItWorks.step3.title')}</h3>
                  <p className="text-gray-600 leading-relaxed">{t('landing.howItWorks.step3.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-block bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                Partnership Benefits
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('landing.benefits.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* For Reporters */}
              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    {t('landing.benefits.reporters.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.reporters.list1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.reporters.list2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.reporters.list3')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* For Validators */}
              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    {t('landing.benefits.validators.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.validators.list1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.validators.list2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.validators.list3')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* For Institutions */}
              <Card className="bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    {t('landing.benefits.institutions.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.institutions.list1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.institutions.list2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">{t('landing.benefits.institutions.list3')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-r from-purple-50 via-blue-50 to-orange-50">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('landing.cta.title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              {t('landing.cta.description')}
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 md:px-12 py-3 md:py-4 text-lg md:text-xl font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 group"
            >
              {t('landing.hero.cta')}
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>
      </div>
    );
  }

              <div className="text-center">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-r from-pink-500 to-red-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
                    3
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{t('landing.howItWorks.step3.title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t('landing.howItWorks.step3.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('landing.benefits.title')}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* For Reporters */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-white text-center mb-4">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                    {t('landing.benefits.reporters.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.reporters.list1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.reporters.list2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.reporters.list3')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* For Validators */}
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border-green-500/20 hover:border-green-400/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-white text-center mb-4">
                    <Shield className="w-8 h-8 mx-auto mb-3 text-green-400" />
                    {t('landing.benefits.validators.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.validators.list1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.validators.list2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.validators.list3')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* For Institutions */}
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-white text-center mb-4">
                    <Building2 className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                    {t('landing.benefits.institutions.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.institutions.list1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.institutions.list2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{t('landing.benefits.institutions.list3')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('landing.cta.title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              {t('landing.cta.description')}
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 md:px-12 py-3 md:py-4 text-lg md:text-xl font-semibold rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 group"
            >
              {t('landing.hero.cta')}
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>
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
            {t('home.mainDashboard')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('home.dashboardSubtitle')}
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
                  <p className="text-blue-100 text-sm">{t('home.stats.totalInstitutions')}</p>
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
                  <p className="text-green-100 text-sm">{t('home.stats.totalReports')}</p>
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
                  <p className="text-purple-100 text-sm">{t('home.stats.rtkBalance')}</p>
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
                  <p className="text-orange-100 text-sm">{t('home.stats.stakedAmount')}</p>
                  <p className="text-2xl font-bold">{parseFloat(platformStats.stakedAmount).toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Sale Section */}
        <div className="mb-12">
          <TokenSaleCard onPurchaseSuccess={refreshData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Institutions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                {t('institution.yourInstitutions')}
              </h2>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('institution.createNew')}
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
                        {t('institution.enterAs').replace('{role}', institution.role)}
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
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t('institution.notRegistered')}</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {t('institution.notRegisteredDesc')}
                  </p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('institution.createFirst')}
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
                  {t('institution.quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-blue-50 border-blue-200"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('institution.create')}
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
