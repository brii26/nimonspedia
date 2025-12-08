import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardBody,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Button, Badge, Switch, Modal, ModalHeader, ModalBody, ModalFooter,
  Input, Alert, Spinner, Tabs, TabList, Tab, TabPanels, TabPanel,
  SearchInput, Pagination, Toast, SelectDropdown
} from '../../components/ui/index.js';
import type { SelectOption } from '../../components/ui/index.js';

// ... (Interfaces DashboardStats, FeatureFlag, User, UserFlags tetap sama)

// Update Interface GlobalFeature untuk handling state lokal UI
interface GlobalFeature {
  access_id: string;
  feature_name: string;
  reason?: string;
  is_enabled: boolean;
  // State lokal untuk editing
  pending_enabled?: boolean;
  pending_reason?: string;
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
  // ... (State stats, users, loading, dll tetap sama)
  const [stats, setStats] = useState<DashboardStats>({
      totalUsers: 0, totalBuyers: 0, totalSellers: 0, activeAuctions: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [features, setFeatures] = useState<GlobalFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>('10');
  const [activeTab, setActiveTab] = useState<string>('0');

  // Modal States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFlagsModal, setShowFlagsModal] = useState<boolean>(false);
  
  // NEW: Global Feature Confirmation Modal State
  const [showGlobalConfirmModal, setShowGlobalConfirmModal] = useState<boolean>(false);
  const [pendingGlobalFeature, setPendingGlobalFeature] = useState<GlobalFeature | null>(null);

  // User flags state
  const [userFlags, setUserFlags] = useState<UserFlags>({ checkout: true, chat: true, auction: true });
  const [flagReasons, setFlagReasons] = useState<FlagReasons>({ checkout: '', chat: '', auction: '' });
  const [flagErrors, setFlagErrors] = useState<FlagErrors>({});

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, itemsPerPage]);

  useEffect(() => {
    fetchDashboardData();
  }, [currentPage, searchTerm, roleFilter, itemsPerPage]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, usersRes, featuresRes] = await Promise.all([
        fetch('/api/node/admin/stats', { headers }),
        fetch(`/api/node/admin/users?page=${currentPage}&search=${searchTerm}&role=${roleFilter}&limit=${itemsPerPage}`, { headers }),
        fetch('/api/node/admin/flags/global', { headers })
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        handleLogout();
        return;
      }

      const statsData = await statsRes.json();
      setStats(statsData.data || { totalUsers: 0, totalBuyers: 0, totalSellers: 0, activeAuctions: 0 });
      
      const usersData = await usersRes.json();
      setUsers(usersData.data || []); 
      if (usersData.pagination) setTotalPages(usersData.pagination.total_pages || 1);

      const featuresData = await featuresRes.json();
      const sortedFeatures = (featuresData.data || []).sort((a: GlobalFeature, b: GlobalFeature) => 
        a.feature_name.localeCompare(b.feature_name)
      ) .map((f: GlobalFeature) => ({
          ...f,
          pending_enabled: f.is_enabled, // Init pending state
          pending_reason: f.is_enabled ? '' : (f.reason || '')
      }));
      setFeatures(sortedFeatures);

    } catch (err) {
      console.error("Dashboard Error:", err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC USER FLAGS (Sama, tapi pakai Toast) ---
  const handleOpenFlagsModal = (user: User) => {
    setSelectedUser(user);
    const currentFlags = {
      checkout: user.feature_flags?.some(f => f.feature_name === 'checkout_enabled' && f.is_enabled) ?? true,
      chat: user.feature_flags?.some(f => f.feature_name === 'chat_enabled' && f.is_enabled) ?? true,
      auction: user.feature_flags?.some(f => f.feature_name === 'auction_enabled' && f.is_enabled) ?? true
    };
    setUserFlags(currentFlags);
    setFlagReasons({ checkout: '', chat: '', auction: '' });
    setFlagErrors({});
    setShowFlagsModal(true);
  };

  const handleUserReasonChange = (flagName: string, reason: string) => {
      setFlagReasons(prev => ({ ...prev, [flagName]: reason }));
      if (!userFlags[flagName] && reason.trim().length < 10) {
          setFlagErrors(prev => ({ ...prev, [flagName]: 'Alasan minimal 10 karakter' }));
      } else {
          setFlagErrors(prev => ({ ...prev, [flagName]: '' }));
      }
  };

  const handleSaveUserFlags = async () => {
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
      const flagNameMap = { checkout: 'checkout_enabled', chat: 'chat_enabled', auction: 'auction_enabled' };
      const flagUpdates = Object.keys(userFlags).map(async (flagName) => {
        const reason = userFlags[flagName] ? 'Enabled via Dashboard' : flagReasons[flagName];
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
      showToast('User flags updated successfully', 'success');
      setShowFlagsModal(false);
      setSelectedUser(null);
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to update user flags', 'error');
    }
  };
  
  // 1. Handle toggle click (Update local pending state only)
  const handleGlobalToggle = (featureName: string, newValue: boolean) => {
    setFeatures(prev => prev.map(f => 
      f.feature_name === featureName 
        ? { ...f, pending_enabled: newValue, pending_reason: newValue ? '' : f.pending_reason } 
        : f
    ));
  };

  // 2. Handle Reason Input Change
  const handleGlobalReasonChange = (featureName: string, newReason: string) => {
    setFeatures(prev => prev.map(f => 
        f.feature_name === featureName ? { ...f, pending_reason: newReason } : f
    ));
  };

  // 3. Trigger Confirmation Modal
  const handleSaveGlobalClick = (feature: GlobalFeature) => {
     // Validation: Jika disable, wajib reason min 20 char
     if (!feature.pending_enabled) {
         if ((feature.pending_reason?.trim().length || 0) < 20) {
             showToast('Alasan mematikan fitur global minimal 20 karakter', 'error');
             return;
         }
     }
     setPendingGlobalFeature(feature);
     setShowGlobalConfirmModal(true);
  };

  // 4. Confirm Save (API Call)
  const confirmSaveGlobalFeature = async () => {
      if (!pendingGlobalFeature) return;

      try {
        const response = await fetch(`/api/node/admin/flags/global`, {
            method: 'POST', 
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            },
            body: JSON.stringify({ 
                feature_name: pendingGlobalFeature.feature_name,
                is_enabled: pendingGlobalFeature.pending_enabled,
                reason: pendingGlobalFeature.pending_enabled ? 'Enabled via Dashboard' : pendingGlobalFeature.pending_reason
            })
        });

        if (response.ok) {
            showToast(`Global feature ${pendingGlobalFeature.feature_name} updated`, 'success');
            fetchDashboardData(); // Refresh data asli
            setShowGlobalConfirmModal(false);
            setPendingGlobalFeature(null);
        } else {
            throw new Error('Update failed');
        }
      } catch (err) {
          showToast('Failed to update global feature', 'error');
      }
  };

  // --- RENDER ---

  const getUserRoleBadge = (role: string) => {
    const variants: Record<string, string> = { BUYER: 'info', SELLER: 'success', ADMIN: 'danger' };
    return <Badge variant={variants[role] || 'gray'}>{role}</Badge>;
  };

  // Only show full-page spinner on initial load (no previous data)
  const isInitialLoading = loading && users.length === 0 && searchTerm === '';
  
  if (isInitialLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">Manage users and system features</p>
        </div>
        <Button variant="danger" onClick={handleLogout}>Logout</Button>
      </header>

      {/* Stats Cards ... (Tetap sama) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardBody><div className="text-4xl font-bold text-[#667eea]">{stats.totalUsers}</div></CardBody></Card>
        <Card><CardHeader><CardTitle>Buyers</CardTitle></CardHeader><CardBody><div className="text-4xl font-bold text-blue-600">{stats.totalBuyers}</div></CardBody></Card>
        <Card><CardHeader><CardTitle>Sellers</CardTitle></CardHeader><CardBody><div className="text-4xl font-bold text-green-600">{stats.totalSellers}</div></CardBody></Card>
        <Card><CardHeader><CardTitle>Active Auctions</CardTitle></CardHeader><CardBody><div className="text-4xl font-bold text-orange-600">{stats.activeAuctions}</div></CardBody></Card>
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
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                  <SearchInput
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onSearch={setSearchTerm}
                    debounce={300} 
                    icon="🔍"
                    className="max-w-md flex-1"
                  />
                  <SelectDropdown
                    variant="fixed"
                    options={[
                      { value: '', label: 'All Roles' },
                      { value: 'BUYER', label: 'Buyer' },
                      { value: 'SELLER', label: 'Seller' },
                      { value: 'ADMIN', label: 'Admin' }
                    ]}
                    value={roleFilter}
                    onChange={setRoleFilter}
                    placeholder="Filter by Role"
                    className="min-w-[160px]"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <SelectDropdown
                      variant="editable"
                      value={itemsPerPage}
                      onChange={setItemsPerPage}
                      options={[
                        { value: '10', label: '10' },
                        { value: '25', label: '25' },
                        { value: '50', label: '50' },
                        { value: '100', label: '100' }
                      ]}
                      placeholder="10"
                      inputType="number"
                      min={1}
                      max={200}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Table ... (Tetap sama) */}
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
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {searchTerm || roleFilter 
                              ? `Hasil tidak ditemukan${searchTerm ? ` untuk "${searchTerm}"` : ''}${roleFilter ? ` dengan role "${roleFilter}"` : ''}`
                              : 'Tidak ada data pengguna'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map(user => (
                          <TableRow key={user.user_id}>
                            <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-gray-600">{user.email}</TableCell>
                            <TableCell>{getUserRoleBadge(user.role)}</TableCell>
                            <TableCell className="font-semibold text-green-600">Rp {(user.balance || 0).toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-gray-600">{new Date(user.created_at).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="primary" onClick={() => handleOpenFlagsModal(user)}>Kelola Flags</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 flex justify-center">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </TabPanel>

              {/* REVISI GLOBAL FLAGS SECTION */}
              <TabPanel eventKey={'1'} activeTab={activeTab}>
                <div className="mb-6">
                    <Alert variant="warning">
                        <strong>Warning:</strong> Mengubah Global Feature Flags akan berdampak pada seluruh pengguna aplikasi. Mohon berhati-hati.
                    </Alert>
                </div>
                <div className="space-y-6">
                  {features.map(feature => {
                    const isToggleChanged = feature.is_enabled !== feature.pending_enabled;
                    const isReasonChanged = (feature.reason || '') !== (feature.pending_reason || '');

                    const isChanged = isToggleChanged || isReasonChanged;
                    return (
                        <Card key={feature.access_id} className={`transition-shadow border-l-4 ${feature.is_enabled ? 'border-green-500' : 'border-red-500'}`}>
                        <CardBody>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {feature.feature_name.replace(/_/g, ' ').toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Status: <span className={feature.is_enabled ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                                {feature.is_enabled ? 'ENABLED' : 'DISABLED'}
                                            </span>
                                        </p>
                                    </div>
                                    <Switch
                                        id={`feature-${feature.access_id}`}
                                        name={`feature-${feature.feature_name}`}
                                        label=""
                                        checked={feature.pending_enabled ?? feature.is_enabled}
                                        onChange={() => handleGlobalToggle(feature.feature_name, !feature.pending_enabled)}
                                    />
                                </div>
                                
                                {/* Show input reason only if pending status is DISABLED */}
                                {feature.pending_enabled === false && (
                                    <div className="mt-2 bg-red-50 p-3 rounded-md">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Alasan mematikan fitur (Wajib, Min 20 Karakter) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea 
                                            className="w-full border border-red-300 rounded p-2 text-sm focus:ring-red-500"
                                            rows={2}
                                            placeholder="Jelaskan alasan pemadaman fitur global..."
                                            value={feature.pending_reason}
                                            onChange={(e) => handleGlobalReasonChange(feature.feature_name, e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(feature.pending_reason?.length || 0)}/20 karakter
                                        </p>
                                    </div>
                                )}

                                {/* Save Button only if changed */}
                                {isChanged && (
                                    <div className="flex justify-end mt-2">
                                        <Button size="sm" variant="primary" onClick={() => handleSaveGlobalClick(feature)}>
                                            Simpan Perubahan
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                        </Card>
                    );
                  })}
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modal Kelola Flags User */}
      <Modal isOpen={showFlagsModal} onClose={() => setShowFlagsModal(false)} size="lg">
        <ModalHeader onClose={() => setShowFlagsModal(false)}>
          Kelola Feature Flags - {selectedUser?.name}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-800 text-sm"><strong>User:</strong> {selectedUser?.email}</p>
            </div>
            {['checkout', 'chat', 'auction'].map(flag => (
                <div key={flag} className={`border rounded-lg p-4 ${!userFlags[flag] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={userFlags[flag]}
                            onChange={(e) => {
                                setUserFlags(prev => ({ ...prev, [flag]: e.target.checked }));
                                if (e.target.checked) handleUserReasonChange(flag, '');
                            }}
                            className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                            <label className="block font-semibold text-gray-900 capitalize">{flag} Feature</label>
                            {!userFlags[flag] && (
                                <div className="mt-2">
                                    <label className="text-sm text-gray-700">Alasan disable <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={flagReasons[flag]}
                                        onChange={(e) => handleUserReasonChange(flag, e.target.value)}
                                        className="w-full border rounded p-2 text-sm mt-1"
                                        placeholder="Min 10 karakter..."
                                    />
                                    {flagErrors[flag] && <p className="text-xs text-red-600 mt-1">{flagErrors[flag]}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowFlagsModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSaveUserFlags}>Simpan Flags</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showGlobalConfirmModal} onClose={() => setShowGlobalConfirmModal(false)} size="md">
          <ModalHeader onClose={() => setShowGlobalConfirmModal(false)}>Konfirmasi Perubahan Global</ModalHeader>
          <ModalBody>
              <p>Apakah Anda yakin ingin mengubah status fitur <strong>{pendingGlobalFeature?.feature_name}</strong>?</p>
              <p className="mt-2 text-sm text-gray-600">
                  Tindakan: <strong>{pendingGlobalFeature?.pending_enabled ? 'MENGAKTIFKAN' : 'MEMATIKAN'}</strong>
              </p>
              {!pendingGlobalFeature?.pending_enabled && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded italic">
                      " {pendingGlobalFeature?.pending_reason} "
                  </p>
              )}
          </ModalBody>
          <ModalFooter>
              <Button variant="secondary" onClick={() => setShowGlobalConfirmModal(false)}>Batal</Button>
              <Button variant="primary" onClick={confirmSaveGlobalFeature}>Ya, Simpan Perubahan</Button>
          </ModalFooter>
      </Modal>
    </div>
  );
};

export default Dashboard;