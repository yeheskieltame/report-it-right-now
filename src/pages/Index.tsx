
import React from 'react';
import Layout from '../components/Layout';
import DashboardRouter from '../components/DashboardRouter';
import { WalletProvider } from '../context/WalletContext';

const Index = () => {
  return (
    <WalletProvider>
      <Layout>
        <DashboardRouter />
      </Layout>
    </WalletProvider>
  );
};

export default Index;
