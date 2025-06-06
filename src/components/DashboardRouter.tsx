
import React from 'react';
import { useWallet } from '../context/WalletContext';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import ValidatorDashboard from './dashboards/ValidatorDashboard';
import ModernReporterDashboard from './dashboards/ModernReporterDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Zap } from 'lucide-react';

const DashboardRouter: React.FC = () => {
  const { isConnected, role, address } = useWallet();

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-full max-w-lg mx-4 bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Welcome to Decentralized Reporting
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Connect your wallet to access the blockchain-based reporting system and start making a difference in your community.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Zap className="w-4 h-4" />
              <span>Powered by Taranium Network</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Current role:', role, 'Address:', address);

  switch (role) {
    case 'owner':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'validator':
      return <ValidatorDashboard />;
    case 'pelapor':
    default:
      return <ModernReporterDashboard />;
  }
};

export default DashboardRouter;
