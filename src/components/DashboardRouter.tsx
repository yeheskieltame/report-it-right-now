
import React from 'react';
import { useWallet } from '../context/WalletContext';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import ValidatorDashboard from './dashboards/ValidatorDashboard';
import ReporterDashboard from './dashboards/ReporterDashboard';
import { Card, CardContent } from '@/components/ui/card';

const DashboardRouter: React.FC = () => {
  const { isConnected, role } = useWallet();

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Welcome to Decentralized Reporting</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to access the reporting system
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  switch (role) {
    case 'owner':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'validator':
      return <ValidatorDashboard />;
    case 'pelapor':
    default:
      return <ReporterDashboard />;
  }
};

export default DashboardRouter;
