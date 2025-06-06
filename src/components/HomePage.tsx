
import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Shield, FileText, Plus, Crown, User } from 'lucide-react';
import CreateInstitutionModal from './modals/CreateInstitutionModal';

interface UserInstitution {
  institusiId: number;
  name: string;
  role: 'admin' | 'validator' | 'pelapor';
  treasury: string;
}

const HomePage: React.FC = () => {
  const { isConnected, address, contractService, role } = useWallet();
  const [userInstitutions, setUserInstitutions] = useState<UserInstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isConnected && contractService && address) {
      loadUserInstitutions();
    }
  }, [isConnected, contractService, address]);

  const loadUserInstitutions = async () => {
    if (!contractService || !address) return;
    
    setLoading(true);
    try {
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
      
      setUserInstitutions(institutions);
    } catch (error) {
      console.error('Error loading user institutions:', error);
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
      case 'admin': return 'bg-purple-500 hover:bg-purple-600';
      case 'validator': return 'bg-green-500 hover:bg-green-600';
      case 'pelapor': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleInstitutionSelect = (institusiId: number, role: string) => {
    // Store selected institution and role in localStorage for dashboard use
    localStorage.setItem('selectedInstitution', institusiId.toString());
    localStorage.setItem('selectedRole', role);
    
    // Redirect to dashboard
    window.location.reload();
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-full max-w-2xl mx-4 bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Decentralized Reporting System
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto">
              A blockchain-based reporting platform that ensures transparency, accountability, and trust in institutional governance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Secure</h3>
                <p className="text-sm text-gray-600">Blockchain secured</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Transparent</h3>
                <p className="text-sm text-gray-600">Public validation</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Accountable</h3>
                <p className="text-sm text-gray-600">Immutable records</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Connect your wallet to get started
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select an institution to continue or create a new institution to get started.
          </p>
        </div>

        {/* Super Admin Badge */}
        {role === 'owner' && (
          <div className="mb-8 text-center">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 text-lg">
              <Crown className="w-5 h-5 mr-2" />
              Super Administrator
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Institutions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Institutions</h2>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userInstitutions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userInstitutions.map((institution) => (
                  <Card 
                    key={`${institution.institusiId}-${institution.role}`}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200"
                    onClick={() => handleInstitutionSelect(institution.institusiId, institution.role)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                          {institution.name}
                        </CardTitle>
                        <Badge className={`${getRoleColor(institution.role)} text-white`}>
                          {getRoleIcon(institution.role)}
                          <span className="ml-1 capitalize">{institution.role}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-gray-600">
                        <p>Institution ID: #{institution.institusiId}</p>
                        <p className="truncate">Treasury: {institution.treasury}</p>
                      </div>
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstitutionSelect(institution.institusiId, institution.role);
                        }}
                      >
                        Enter as {institution.role}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Institutions Found</h3>
                  <p className="text-gray-600 mb-6">
                    You are not registered in any institution yet. Create a new institution or ask an admin to add you.
                  </p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Institution
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-white">Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Institutions</span>
                    <span className="font-bold">{userInstitutions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Your Roles</span>
                    <span className="font-bold">{new Set(userInstitutions.map(i => i.role)).size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Institution
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={loadUserInstitutions}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Refresh Institutions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateInstitutionModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadUserInstitutions}
      />
    </div>
  );
};

export default HomePage;
