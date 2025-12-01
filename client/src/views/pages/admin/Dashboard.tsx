import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardBody,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Button,
  Badge,
  Switch,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Alert,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SearchInput,
  Pagination
} from '../../components/ui/index.js';

// TypeScript interfaces
interface DashboardStats {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  activeAuctions: number;
}

interface FeatureFlag {
  feature_name: string;
  is_enabled: boolean;
}

interface User {
  user_id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  balance?: number;
  created_at: string;
  feature_flags?: FeatureFlag[];
}

interface GlobalFeature {
  access_id: string;
  feature_name: string;
  reason?: string;
  is_enabled: boolean;
}

interface UserFlags {
  checkout: boolean;
  chat: boolean;
  auction: boolean;
  [key: string]: boolean;
}

interface FlagReasons {
  checkout: string;
  chat: string;
  auction: string;
  [key: string]: string;
}

interface FlagErrors {
  [key: string]: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    activeAuctions: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [features, setFeatures] = useState<GlobalFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showFlagsModal, setShowFlagsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('0');
  
  // User flags state
  const [userFlags, setUserFlags] = useState<UserFlags>({
    checkout: true,
    chat: true,
    auction: true
  });
  const [flagReasons, setFlagReasons] = useState<FlagReasons>({
    checkout: '',
    chat: '',
    auction: ''
  });
  const [flagErrors, setFlagErrors] = useState<FlagErrors>({});

  useEffect(() => {
    fetchDashboardData();
  }, [currentPage, searchTerm]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, featuresRes] = await Promise.all([
        fetch('/api/node/admin/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        }),
        fetch(`/api/node/admin/users?page=${currentPage}&search=${searchTerm}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        }),
        fetch('/api/node/admin/flags/global', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        })
      ]);

      if (statsRes.status === 403 || usersRes.status === 403 || featuresRes.status === 403) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
        return;
      }

      const statsData = await statsRes.json();
      if (statsData.success && statsData.data) {
        setStats(statsData.data);
      } else {
        setStats({ totalUsers: 0, totalBuyers: 0, totalSellers: 0, activeAuctions: 0 });
      }
      
      const usersData = await usersRes.json();
      const featuresData = await featuresRes.json();

      console.log('Features Response:', featuresData); // Debug feature flags

      setUsers(usersData.data || []); 

      if (usersData.pagination) {
        setTotalPages(usersData.pagination.total_pages || 1);
      }

      setFeatures(featuresData.data || []);

    } catch (err) {
      console.error("Dashboard Error:", err); // Log error biar gampang debug
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (featureName: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/node/admin/flags/global`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
            feature_name: featureName,
            is_enabled: !currentStatus,
            reason: 'Changed via Dashboard'
        })
      });

      if (response.ok) {
        setSuccess('Feature updated successfully');
        fetchDashboardData();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      setError('Failed to update feature');
    }
  };

  const handleOpenFlagsModal = (user: User) => {
    setSelectedUser(user);
    // Set current flags dari user data
    const currentFlags = {
      checkout: user.feature_flags?.some((f: FeatureFlag) => f.feature_name === 'checkout_enabled' && f.is_enabled) ?? true,
      chat: user.feature_flags?.some((f: FeatureFlag) => f.feature_name === 'chat_enabled' && f.is_enabled) ?? true,
      auction: user.feature_flags?.some((f: FeatureFlag) => f.feature_name === 'auction_enabled' && f.is_enabled) ?? true
    };
    setUserFlags(currentFlags);
    setFlagReasons({ checkout: '', chat: '', auction: '' });
    setFlagErrors({});
    setShowFlagsModal(true);
  };

  const handleFlagChange = (flagName: string, isChecked: boolean) => {
    setUserFlags(prev => ({ ...prev, [flagName]: isChecked }));
    // Clear reason and error if checked
    if (isChecked) {
      setFlagReasons(prev => ({ ...prev, [flagName]: '' }));
      setFlagErrors(prev => ({ ...prev, [flagName]: '' }));
    }
  };

  const handleReasonChange = (flagName: string, reason: string) => {
    setFlagReasons(prev => ({ ...prev, [flagName]: reason }));
    // Validate reason length
    if (reason.trim().length < 10) {
      setFlagErrors(prev => ({ ...prev, [flagName]: 'Alasan minimal 10 karakter' }));
    } else {
      setFlagErrors(prev => ({ ...prev, [flagName]: '' }));
    }
  };

  const handleSaveUserFlags = async () => {
    // Validate: jika ada flag yang unchecked, harus ada reason minimal 10 char
    const errors: FlagErrors = {};
    Object.keys(userFlags).forEach(flagName => {
      if (!userFlags[flagName] && (flagReasons[flagName]?.trim().length || 0) < 10) {
        errors[flagName] = 'Alasan minimal 10 karakter';
      }
    });

    if (Object.keys(errors).length > 0) {
      setFlagErrors(errors);
      return;
    }

    try {
      const flagNameMap = {
        checkout: 'checkout_enabled',
        chat: 'chat_enabled',
        auction: 'auction_enabled'
      };

      // Send requests untuk setiap flag yang berubah
      const flagUpdates = Object.keys(userFlags).map(async (flagName) => {
        const reason = userFlags[flagName] 
          ? 'Enabled via Dashboard' 
          : flagReasons[flagName];
        
        return fetch('/api/node/admin/flags/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify({
            user_id: selectedUser?.user_id,
            feature_name: flagNameMap[flagName as keyof typeof flagNameMap],
            is_enabled: userFlags[flagName],
            reason: reason
          })
        });
      });

      await Promise.all(flagUpdates);
      
      setSuccess('User flags updated successfully');
      setShowFlagsModal(false);
      setSelectedUser(null);
      fetchDashboardData();
    } catch (err) {
      setError('Failed to update user flags');
    }
  };

  const getUserRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      buyer: 'info',
      seller: 'success',
      admin: 'danger'
    };
    return <Badge variant={variants[role] || 'gray'}>{role}</Badge>;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-lg text-gray-600">Manage users and system features</p>
      </header>

      {error && (
        <Alert variant="error" onClose={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} className="mb-6">
          {success}
        </Alert>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-4xl font-bold text-[#667eea]">{stats.totalUsers}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyers</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-4xl font-bold text-blue-600">{stats.totalBuyers}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sellers</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-4xl font-bold text-green-600">{stats.totalSellers}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Auctions</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-4xl font-bold text-orange-600">{stats.activeAuctions}</div>
          </CardBody>
        </Card>
      </section>

      <Card className="shadow-lg">
        <CardBody>
          <Tabs defaultActiveKey={'0'} activeKey={activeTab} onSelect={setActiveTab}>
            <TabList activeTab={activeTab} onSelect={setActiveTab}>
              <Tab eventKey={'0'} activeTab={activeTab} onSelect={setActiveTab}>User Management</Tab>
              <Tab eventKey={'1'} activeTab={activeTab} onSelect={setActiveTab}>Feature Flags</Tab>
            </TabList>

            <TabPanels activeTab={activeTab}>
              <TabPanel eventKey={'0'} activeTab={activeTab}>
                <div className="mb-6">
                  <SearchInput
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    onSearch={setSearchTerm}
                    debounce={500}
                    icon="🔍"
                    className="max-w-md"
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Table striped hover>
                    <TableHead>
                      <TableRow>
                        <TableHeader>ID</TableHeader>
                        <TableHeader>Nama</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Role</TableHeader>
                        <TableHeader>Balance</TableHeader>
                        <TableHeader>Tanggal Daftar</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-gray-600">{user.email}</TableCell>
                          <TableCell>{getUserRoleBadge(user.role)}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            Rp {(user.balance || 0).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="primary"
                              onClick={() => handleOpenFlagsModal(user)}
                            >
                              Kelola Flags
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </TabPanel>

              <TabPanel eventKey={'1'} activeTab={activeTab}>
                <div className="space-y-4">
                  {features.map(feature => (
                    <Card key={feature.access_id} className="hover:shadow-md transition-shadow">
                      <CardBody>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                              {feature.feature_name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {feature.reason || "No reason"}
                            </p>
                          </div>
                          <Switch
                            id={`feature-${feature.access_id}`}
                            name={`feature-${feature.feature_name}`}
                            label=""
                            checked={feature.is_enabled}
                            onChange={() => handleToggleFeature(feature.feature_name, feature.is_enabled)}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modal Kelola Flags User */}
      <Modal
        isOpen={showFlagsModal}
        onClose={() => {
          setShowFlagsModal(false);
          setSelectedUser(null);
          setFlagErrors({});
        }}
        size="lg"
      >
        <ModalHeader onClose={() => {
          setShowFlagsModal(false);
          setSelectedUser(null);
          setFlagErrors({});
        }}>
          Kelola Feature Flags - {selectedUser?.name}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-800 text-sm">
                <strong>User:</strong> {selectedUser?.email} ({selectedUser?.role})
              </p>
            </div>

            {/* Checkout Flag */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="flag-checkout"
                  checked={userFlags.checkout}
                  onChange={(e) => handleFlagChange('checkout', e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#667eea] border-gray-300 rounded focus:ring-[#667eea]"
                />
                <div className="flex-1">
                  <label htmlFor="flag-checkout" className="block font-semibold text-gray-900 mb-1">
                    Checkout Feature
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Izinkan user melakukan checkout dan pembayaran
                  </p>
                  
                  {!userFlags.checkout && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alasan menonaktifkan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={flagReasons.checkout}
                        onChange={(e) => handleReasonChange('checkout', e.target.value)}
                        placeholder="Minimal 10 karakter..."
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          flagErrors.checkout 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-[#667eea]'
                        }`}
                      />
                      {flagErrors.checkout && (
                        <p className="mt-1 text-sm text-red-600">{flagErrors.checkout}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Flag */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="flag-chat"
                  checked={userFlags.chat}
                  onChange={(e) => handleFlagChange('chat', e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#667eea] border-gray-300 rounded focus:ring-[#667eea]"
                />
                <div className="flex-1">
                  <label htmlFor="flag-chat" className="block font-semibold text-gray-900 mb-1">
                    Chat Feature
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Izinkan user berkomunikasi via chat dengan penjual
                  </p>
                  
                  {!userFlags.chat && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alasan menonaktifkan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={flagReasons.chat}
                        onChange={(e) => handleReasonChange('chat', e.target.value)}
                        placeholder="Minimal 10 karakter..."
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          flagErrors.chat 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-[#667eea]'
                        }`}
                      />
                      {flagErrors.chat && (
                        <p className="mt-1 text-sm text-red-600">{flagErrors.chat}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Auction Flag */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="flag-auction"
                  checked={userFlags.auction}
                  onChange={(e) => handleFlagChange('auction', e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#667eea] border-gray-300 rounded focus:ring-[#667eea]"
                />
                <div className="flex-1">
                  <label htmlFor="flag-auction" className="block font-semibold text-gray-900 mb-1">
                    Auction Feature
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Izinkan user berpartisipasi dalam lelang produk
                  </p>
                  
                  {!userFlags.auction && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alasan menonaktifkan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={flagReasons.auction}
                        onChange={(e) => handleReasonChange('auction', e.target.value)}
                        placeholder="Minimal 10 karakter..."
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          flagErrors.auction 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-[#667eea]'
                        }`}
                      />
                      {flagErrors.auction && (
                        <p className="mt-1 text-sm text-red-600">{flagErrors.auction}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowFlagsModal(false);
              setSelectedUser(null);
              setFlagErrors({});
            }}
          >
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveUserFlags}>
            Simpan Flags
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Dashboard;