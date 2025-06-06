
import React from 'react';
import { useWallet } from '../context/WalletContext';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import ValidatorDashboard from './dashboards/ValidatorDashboard';
import ModernReporterDashboard from './dashboards/ModernReporterDashboard';
import HomePage from './HomePage';

const DashboardRouter: React.FC = () => {
  const { isConnected, role } = useWallet();

  if (!isConnected) {
    return <HomePage />;
  }

  // Check if user has selected an institution
  const selectedInstitution = localStorage.getItem('selectedInstitution');
  const selectedRole = localStorage.getItem('selectedRole');

  // If no institution selected or user is super admin, show appropriate dashboard
  if (!selectedInstitution || role === 'owner') {
    switch (role) {
      case 'owner':
        return <SuperAdminDashboard />;
      default:
        return <HomePage />;
    }
  }

  // Show dashboard based on selected role
  switch (selectedRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'validator':
      return <ValidatorDashboard />;
    case 'pelapor':
      return <ModernReporterDashboard />;
    default:
      return <HomePage />;
  }
};

export default DashboardRouter;
