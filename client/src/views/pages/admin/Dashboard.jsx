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
} from '../../components/ui';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    activeAuctions: 0
  });
  const [users, setUsers] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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

      const statsData = await statsRes.json();
      if (statsData.success && statsData.data) {
        setStats(statsData.data);
      } else {
        setStats({ totalUsers: 0, totalBuyers: 0, totalSellers: 0, activeAuctions: 0 });
      }
      
      const usersData = await usersRes.json();
      const featuresData = await featuresRes.json();

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

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/node/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchDashboardData();
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleToggleFeature = async (featureName, currentStatus) => {
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

  const getUserRoleBadge = (role) => {
    const variants = {
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
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab eventKey={0}>User Management</Tab>
              <Tab eventKey={1}>Feature Flags</Tab>
            </TabList>

            <TabPanels>
              <TabPanel eventKey={0}>
                <div className="mb-6">
                  <SearchInput
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onSearch={setSearchTerm}
                    debounce={500}
                    className="max-w-md"
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Table striped hover>
                    <TableHead>
                      <TableRow>
                        <TableHeader>ID</TableHeader>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Role</TableHeader>
                        <TableHeader>Registered</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">{user.id}</TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-gray-600">{user.email}</TableCell>
                          <TableCell>{getUserRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              disabled={user.role === 'admin'}
                            >
                              Delete
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

              <TabPanel eventKey={1}>
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
                            checked={feature.enabled}
                            onChange={() => handleToggleFeature(feature.feature_name, feature.is_enabled)}
                            label={feature.is_enabled ? 'Enabled' : 'Disabled'}
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

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        size="md"
      >
        <ModalHeader onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}>
          Confirm Delete User
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete user{' '}
              <strong className="text-gray-900">{selectedUser?.name}</strong> ({selectedUser?.email})?
            </p>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ This action cannot be undone.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Dashboard;