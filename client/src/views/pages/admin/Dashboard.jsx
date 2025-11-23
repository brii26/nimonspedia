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
        fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }),
        fetch(`/api/admin/users?page=${currentPage}&search=${searchTerm}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }),
        fetch('/api/admin/features', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        })
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const featuresData = await featuresRes.json();

      setStats(statsData.data);
      setUsers(usersData.data.users);
      setTotalPages(usersData.data.totalPages);
      setFeatures(featuresData.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
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

  const handleToggleFeature = async (featureId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ enabled: !currentStatus })
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
    <div className="container mt-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users and system features</p>
      </header>

      {error && (
        <Alert variant="error" onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} className="mb-4">
          {success}
        </Alert>
      )}

      <section className="stats-grid mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="stat-value">{stats.totalUsers}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyers</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="stat-value">{stats.totalBuyers}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sellers</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="stat-value">{stats.totalSellers}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Auctions</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="stat-value">{stats.activeAuctions}</div>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardBody>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>User Management</Tab>
              <Tab>Feature Flags</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <div className="mb-4">
                  <SearchInput
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onSearch={setSearchTerm}
                    debounce={500}
                  />
                </div>

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
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getUserRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="secondary"
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

                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </TabPanel>

              <TabPanel>
                <div className="space-y-4">
                  {features.map(feature => (
                    <Card key={feature.id}>
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {feature.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {feature.description}
                            </p>
                          </div>
                          <Switch
                            checked={feature.enabled}
                            onChange={() => handleToggleFeature(feature.id, feature.enabled)}
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
      >
        <ModalHeader>Confirm Delete User</ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete user{' '}
            <strong>{selectedUser?.name}</strong>?
          </p>
          <p className="text-red-600 text-sm mt-2">
            This action cannot be undone.
          </p>
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
          <Button variant="primary" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Dashboard;