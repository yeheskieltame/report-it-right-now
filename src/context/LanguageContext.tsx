import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Simple translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'app.title': 'Decentralized Reporting',
    'app.description': 'A blockchain-based reporting platform ensuring transparency, accountability, and trust in institutional governance',
    
    'features.security.title': 'Blockchain Security',
    'features.security.description': 'Data stored securely with immutable blockchain technology',
    'features.validation.title': 'Public Validation',
    'features.validation.description': 'Every report is validated by trusted validators',
    'features.audit.title': 'Permanent Records',
    'features.audit.description': 'All activities are permanently recorded and auditable',
    'features.connectWallet': 'Connect your wallet to get started',
    
    // Landing Page Content
    'landing.hero.title': 'Revolutionary Reporting Platform',
    'landing.hero.subtitle': 'Transforming institutional governance through blockchain transparency',
    'landing.hero.description': 'Join the future of accountable reporting where every action is recorded, verified, and transparent on the blockchain.',
    'landing.hero.cta': 'Connect Wallet to Start',
    'landing.hero.learnMore': 'Learn More',
    
    // Key Features
    'landing.features.title': 'Why Choose Our Platform?',
    'landing.features.subtitle': 'Built for the future of institutional transparency',
    
    'features.transparency.title': 'Complete Transparency',
    'features.transparency.description': 'Every report, validation, and decision is permanently recorded on blockchain for full accountability',
    'features.decentralized.title': 'Decentralized Governance',
    'features.decentralized.description': 'Community-driven validation ensures unbiased and democratic reporting processes',
    'features.immutable.title': 'Immutable Records',
    'features.immutable.description': 'Once recorded, data cannot be altered or deleted, ensuring permanent evidence trail',
    'features.rewards.title': 'Token Incentives',
    'features.rewards.description': 'Earn RTK tokens for participating in validation and maintaining network integrity',
    'features.global.title': 'Global Access',
    'features.global.description': 'Access the platform from anywhere in the world with just a Web3 wallet',
    'features.realtime.title': 'Real-time Updates',
    'features.realtime.description': 'Get instant notifications and updates on all reporting activities and validations',
    
    // Stats
    'landing.stats.title': 'Trusted by Organizations Worldwide',
    'landing.stats.institutions': 'Active Institutions',
    'landing.stats.reports': 'Reports Processed',
    'landing.stats.validators': 'Active Validators',
    'landing.stats.uptime': 'Network Uptime',
    
    // How It Works
    'landing.howItWorks.title': 'How It Works',
    'landing.howItWorks.subtitle': 'Simple steps to transparent governance',
    'landing.howItWorks.step1.title': 'Connect Wallet',
    'landing.howItWorks.step1.description': 'Link your Web3 wallet to securely access the platform',
    'landing.howItWorks.step2.title': 'Join or Create Institution',
    'landing.howItWorks.step2.description': 'Register with existing institutions or create your own',
    'landing.howItWorks.step3.title': 'Start Reporting',
    'landing.howItWorks.step3.description': 'Submit reports, validate others, and earn rewards',
    
    // Benefits
    'landing.benefits.title': 'Benefits for Everyone',
    'landing.benefits.reporters.title': 'For Reporters',
    'landing.benefits.reporters.list1': 'Protected identity while ensuring accountability',
    'landing.benefits.reporters.list2': 'Earn rewards for quality reports',
    'landing.benefits.reporters.list3': 'Permanent record of contributions',
    'landing.benefits.validators.title': 'For Validators',
    'landing.benefits.validators.list1': 'Earn RTK tokens for honest validation',
    'landing.benefits.validators.list2': 'Build reputation in the network',
    'landing.benefits.validators.list3': 'Help maintain system integrity',
    'landing.benefits.institutions.title': 'For Institutions',
    'landing.benefits.institutions.list1': 'Transparent governance system',
    'landing.benefits.institutions.list2': 'Reduce operational costs',
    'landing.benefits.institutions.list3': 'Build public trust and accountability',
    
    // Final CTA
    'landing.cta.title': 'Ready to Transform Governance?',
    'landing.cta.description': 'Join thousands of organizations already using our platform for transparent, accountable governance.',
    
    'wallet.connect': 'Connect Wallet',
    'wallet.disconnect': 'Disconnect',
    'wallet.connecting': 'Connecting...',
    'wallet.connected': 'Connected',
    'wallet.notConnected': 'Not Connected',
    'wallet.address': 'Address',
    'wallet.balance': 'Balance',
    
    'home.welcome': 'Welcome to Decentralized Reporting',
    'home.subtitle': 'Your trusted platform for transparent reporting and validation',
    'home.getStarted': 'Get Started',
    'home.learnMore': 'Learn More',
    'home.selectRole': 'Select Your Role',
    'home.selectInstitution': 'Select Institution',
    'home.mainDashboard': 'Main Dashboard',
    'home.dashboardSubtitle': 'Choose an institution to continue or create a new one to get started',
    'home.stats.totalInstitutions': 'Total Institutions',
    'home.stats.totalReports': 'Total Reports',
    'home.stats.activeValidators': 'Active Validators',
    'home.stats.resolvedCases': 'Resolved Cases',
    'home.stats.platformReliability': 'Platform Reliability',
    'home.stats.rtkBalance': 'RTK Balance',
    'home.stats.stakedAmount': 'Staked Amount',
    
    'tokenSale.title': 'Buy RTK Tokens',
    'tokenSale.description': 'Purchase RTK tokens to participate in our reward, staking, and appeal systems',
    'tokenSale.currentPrice': 'Current Price',
    'tokenSale.yourBalance': 'Your RTK Balance',
    'tokenSale.ethAmount': 'ETH Amount',
    'tokenSale.estimatedTokens': 'Estimated RTK Tokens',
    'tokenSale.buyTokens': 'Buy Tokens',
    'tokenSale.buying': 'Processing...',
    'tokenSale.success': 'Purchase successful!',
    'tokenSale.error': 'Purchase failed. Please try again.',
    'tokenSale.insufficientFunds': 'Insufficient ETH balance',
    'tokenSale.invalidAmount': 'Please enter a valid amount',
    'tokenSale.info.title': 'Important Information',
    'tokenSale.info.point1': '• RTK tokens are required for reward, staking, and appeal systems',
    'tokenSale.info.point2': '• Token price is fixed and determined by the contract',
    'tokenSale.info.point3': '• Transactions use Taranium Testnet',
    'tokenSale.info.point4': '• Ensure you have enough ETH for gas fees',
    
    'role.reporter': 'Reporter',
    'role.validator': 'Validator',
    'role.admin': 'Admin',
    'role.superAdmin': 'Super Admin',
    'role.reporter.description': 'Submit and track your reports',
    'role.validator.description': 'Validate reports and earn rewards',
    'role.admin.description': 'Manage institution operations',
    'role.superAdmin.description': 'Platform-wide administration',
    
    'institution.selectPlaceholder': 'Select an institution...',
    'institution.noInstitutions': 'No institutions available',
    'institution.create': 'Create Institution',
    'institution.createNew': 'Create New',
    'institution.name': 'Institution Name',
    'institution.description': 'Description',
    'institution.creating': 'Creating...',
    'institution.created': 'Institution created successfully!',
    'institution.error': 'Failed to create institution',
    'institution.yourInstitutions': 'Your Institutions',
    'institution.quickActions': 'Quick Actions',
    'institution.notRegistered': 'Not Registered in Any Institution',
    'institution.notRegisteredDesc': 'You are not registered in any institution. Create a new institution or ask an admin to add you.',
    'institution.createFirst': 'Create First Institution',
    'institution.enterAs': 'Enter as {role}',
    
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.yes': 'Yes',
    'common.no': 'No',
    
    'form.required': 'This field is required',
    'form.invalidEmail': 'Please enter a valid email',
    'form.invalidAddress': 'Please enter a valid address',
    'form.minLength': 'Minimum {count} characters required',
    'form.maxLength': 'Maximum {count} characters allowed',
    
    'language.switch': 'Switch Language',
    'language.english': 'English',
    'language.indonesian': 'Indonesian',
  },
  id: {
    'nav.home': 'Beranda',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Pengaturan',
    'app.title': 'Pelaporan Terdesentralisasi',
    'app.description': 'Platform pelaporan berbasis blockchain yang menjamin transparansi, akuntabilitas, dan kepercayaan dalam tata kelola institusi',
    
    'features.security.title': 'Keamanan Blockchain',
    'features.security.description': 'Data tersimpan aman dengan teknologi blockchain yang tidak dapat diubah',
    'features.validation.title': 'Validasi Publik',
    'features.validation.description': 'Setiap laporan divalidasi oleh validator terpercaya',
    'features.audit.title': 'Rekam Jejak Permanen',
    'features.audit.description': 'Semua aktivitas tercatat permanen dan dapat diaudit',
    'features.connectWallet': 'Hubungkan wallet Anda untuk memulai',
    
    // Landing Page Content
    'landing.hero.title': 'Platform Pelaporan Revolusioner',
    'landing.hero.subtitle': 'Mengubah tata kelola institusi melalui transparansi blockchain',
    'landing.hero.description': 'Bergabunglah dengan masa depan pelaporan akuntabel di mana setiap tindakan dicatat, diverifikasi, dan transparan di blockchain.',
    'landing.hero.cta': 'Hubungkan Dompet untuk Memulai',
    'landing.hero.learnMore': 'Pelajari Lebih Lanjut',
    
    // Key Features
    'landing.features.title': 'Mengapa Memilih Platform Kami?',
    'landing.features.subtitle': 'Dibangun untuk masa depan transparansi institusi',
    
    'features.transparency.title': 'Transparansi Penuh',
    'features.transparency.description': 'Setiap laporan, validasi, dan keputusan tercatat permanen di blockchain untuk akuntabilitas penuh',
    'features.decentralized.title': 'Tata Kelola Terdesentralisasi',
    'features.decentralized.description': 'Validasi yang dipimpin komunitas memastikan proses pelaporan yang tidak memihak dan demokratis',
    'features.immutable.title': 'Rekam Jejak yang Tidak Dapat Diubah',
    'features.immutable.description': 'Setelah dicatat, data tidak dapat diubah atau dihapus, memastikan jejak bukti yang permanen',
    'features.rewards.title': 'Insentif Token',
    'features.rewards.description': 'Dapatkan token RTK untuk berpartisipasi dalam validasi dan menjaga integritas jaringan',
    'features.global.title': 'Akses Global',
    'features.global.description': 'Akses platform dari mana saja di dunia hanya dengan dompet Web3',
    'features.realtime.title': 'Pembaruan Waktu Nyata',
    'features.realtime.description': 'Dapatkan notifikasi dan pembaruan instan tentang semua aktivitas pelaporan dan validasi',
    
    // Stats
    'landing.stats.title': 'Dipercaya oleh Organisasi di Seluruh Dunia',
    'landing.stats.institutions': 'Institusi Aktif',
    'landing.stats.reports': 'Laporan Diproses',
    'landing.stats.validators': 'Validator Aktif',
    'landing.stats.uptime': 'Waktu Aktif Jaringan',
    
    // How It Works
    'landing.howItWorks.title': 'Cara Kerjanya',
    'landing.howItWorks.subtitle': 'Langkah sederhana menuju tata kelola transparan',
    'landing.howItWorks.step1.title': 'Hubungkan Dompet',
    'landing.howItWorks.step1.description': 'Sambungkan dompet Web3 Anda untuk mengakses platform dengan aman',
    'landing.howItWorks.step2.title': 'Bergabung atau Buat Institusi',
    'landing.howItWorks.step2.description': 'Daftar dengan institusi yang ada atau buat milik Anda sendiri',
    'landing.howItWorks.step3.title': 'Mulai Melapor',
    'landing.howItWorks.step3.description': 'Kirim laporan, validasi laporan orang lain, dan dapatkan imbalan',
    
    // Benefits
    'landing.benefits.title': 'Manfaat untuk Semua',
    'landing.benefits.reporters.title': 'Untuk Pelapor',
    'landing.benefits.reporters.list1': 'Identitas terlindungi sambil memastikan akuntabilitas',
    'landing.benefits.reporters.list2': 'Dapatkan imbalan untuk laporan berkualitas',
    'landing.benefits.reporters.list3': 'Rekam jejak permanen kontribusi Anda',
    'landing.benefits.validators.title': 'Untuk Validator',
    'landing.benefits.validators.list1': 'Dapatkan token RTK untuk validasi yang jujur',
    'landing.benefits.validators.list2': 'Bangun reputasi di jaringan',
    'landing.benefits.validators.list3': 'Bantu menjaga integritas sistem',
    'landing.benefits.institutions.title': 'Untuk Institusi',
    'landing.benefits.institutions.list1': 'Sistem tata kelola yang transparan',
    'landing.benefits.institutions.list2': 'Mengurangi biaya operasional',
    'landing.benefits.institutions.list3': 'Membangun kepercayaan dan akuntabilitas publik',
    
    // Final CTA
    'landing.cta.title': 'Siap Mengubah Tata Kelola?',
    'landing.cta.description': 'Bergabunglah dengan ribuan organisasi yang sudah menggunakan platform kami untuk tata kelola yang transparan dan akuntabel.',
    
    'wallet.connect': 'Hubungkan Dompet',
    'wallet.disconnect': 'Putuskan Koneksi',
    'wallet.connecting': 'Menghubungkan...',
    'wallet.connected': 'Terhubung',
    'wallet.notConnected': 'Tidak Terhubung',
    'wallet.address': 'Alamat',
    'wallet.balance': 'Saldo',
    
    'home.welcome': 'Selamat Datang di Pelaporan Terdesentralisasi',
    'home.subtitle': 'Platform terpercaya Anda untuk pelaporan dan validasi yang transparan',
    'home.getStarted': 'Mulai',
    'home.learnMore': 'Pelajari Lebih Lanjut',
    'home.selectRole': 'Pilih Peran Anda',
    'home.selectInstitution': 'Pilih Institusi',
    'home.mainDashboard': 'Dashboard Utama',
    'home.dashboardSubtitle': 'Pilih institusi untuk melanjutkan atau buat institusi baru untuk memulai',
    'home.stats.totalInstitutions': 'Total Institusi',
    'home.stats.totalReports': 'Total Laporan',
    'home.stats.activeValidators': 'Validator Aktif',
    'home.stats.resolvedCases': 'Kasus Terselesaikan',
    'home.stats.platformReliability': 'Keandalan Platform',
    'home.stats.rtkBalance': 'Saldo RTK',
    'home.stats.stakedAmount': 'Jumlah Staking',
    
    'tokenSale.title': 'Beli Token RTK',
    'tokenSale.description': 'Beli token RTK untuk berpartisipasi dalam sistem reward, staking, dan banding kami',
    'tokenSale.currentPrice': 'Harga Saat Ini',
    'tokenSale.yourBalance': 'Saldo RTK Anda',
    'tokenSale.ethAmount': 'Jumlah ETH',
    'tokenSale.estimatedTokens': 'Estimasi Token RTK',
    'tokenSale.buyTokens': 'Beli Token',
    'tokenSale.buying': 'Memproses...',
    'tokenSale.success': 'Pembelian berhasil!',
    'tokenSale.error': 'Pembelian gagal. Silakan coba lagi.',
    'tokenSale.insufficientFunds': 'Saldo ETH tidak mencukupi',
    'tokenSale.invalidAmount': 'Silakan masukkan jumlah yang valid',
    'tokenSale.info.title': 'Informasi Penting',
    'tokenSale.info.point1': '• Token RTK diperlukan untuk sistem reward, staking, dan banding',
    'tokenSale.info.point2': '• Harga token tetap dan ditentukan oleh contract',
    'tokenSale.info.point3': '• Transaksi menggunakan jaringan Taranium Testnet',
    'tokenSale.info.point4': '• Pastikan Anda memiliki cukup ETH untuk gas fee',
    
    'role.reporter': 'Pelapor',
    'role.validator': 'Validator',
    'role.admin': 'Admin',
    'role.superAdmin': 'Super Admin',
    'role.reporter.description': 'Kirim dan lacak laporan Anda',
    'role.validator.description': 'Validasi laporan dan dapatkan reward',
    'role.admin.description': 'Kelola operasi institusi',
    'role.superAdmin.description': 'Administrasi seluruh platform',
    
    'institution.selectPlaceholder': 'Pilih institusi...',
    'institution.noInstitutions': 'Tidak ada institusi tersedia',
    'institution.create': 'Buat Institusi',
    'institution.createNew': 'Buat Baru',
    'institution.name': 'Nama Institusi',
    'institution.description': 'Deskripsi',
    'institution.creating': 'Membuat...',
    'institution.created': 'Institusi berhasil dibuat!',
    'institution.error': 'Gagal membuat institusi',
    'institution.yourInstitutions': 'Institusi Anda',
    'institution.quickActions': 'Aksi Cepat',
    'institution.notRegistered': 'Belum Terdaftar di Institusi',
    'institution.notRegisteredDesc': 'Anda belum terdaftar di institusi manapun. Buat institusi baru atau minta admin untuk menambahkan Anda.',
    'institution.createFirst': 'Buat Institusi Pertama',
    'institution.enterAs': 'Masuk sebagai {role}',
    
    'common.loading': 'Memuat...',
    'common.error': 'Error',
    'common.success': 'Berhasil',
    'common.cancel': 'Batal',
    'common.confirm': 'Konfirmasi',
    'common.save': 'Simpan',
    'common.edit': 'Edit',
    'common.delete': 'Hapus',
    'common.view': 'Lihat',
    'common.back': 'Kembali',
    'common.next': 'Selanjutnya',
    'common.previous': 'Sebelumnya',
    'common.submit': 'Kirim',
    'common.close': 'Tutup',
    'common.open': 'Buka',
    'common.yes': 'Ya',
    'common.no': 'Tidak',
    
    'form.required': 'Field ini wajib diisi',
    'form.invalidEmail': 'Silakan masukkan email yang valid',
    'form.invalidAddress': 'Silakan masukkan alamat yang valid',
    'form.minLength': 'Minimal {count} karakter diperlukan',
    'form.maxLength': 'Maksimal {count} karakter diperbolehkan',
    
    'language.switch': 'Ganti Bahasa',
    'language.english': 'Bahasa Inggris',
    'language.indonesian': 'Bahasa Indonesia',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const value = translations[language]?.[key];
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
