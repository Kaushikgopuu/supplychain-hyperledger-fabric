import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  TrendingUp,
  Notifications,
  QrCode,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { productsAPI, ordersAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { notifications, getUnreadCount } = useSocket();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        productsAPI.getMyProducts(),
        ordersAPI.getAllOrders(),
      ]);

      if (productsResponse.data.success) {
        const products = productsResponse.data.data;
        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          activeProducts: products.filter(p => p.status !== 'Sold').length,
        }));
      }

      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data;
        setStats(prev => ({
          ...prev,
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'Pending').length,
        }));
      }

      // Mock recent activity data
      setRecentActivity([
        { date: '2024-01', products: 45, orders: 23 },
        { date: '2024-02', products: 52, orders: 31 },
        { date: '2024-03', products: 48, orders: 28 },
        { date: '2024-04', products: 61, orders: 35 },
        { date: '2024-05', products: 55, orders: 29 },
        { date: '2024-06', products: 67, orders: 42 },
      ]);

    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleDashboard = () => {
    switch (user?.role) {
      case 'Manufacturer':
        return {
          title: 'Manufacturing Overview',
          primaryMetric: 'Products Created',
          secondaryMetric: 'Orders Received',
          color: '#1976d2'
        };
      case 'Distributor':
        return {
          title: 'Distribution Overview',
          primaryMetric: 'Products in Transit',
          secondaryMetric: 'Orders Processing',
          color: '#388e3c'
        };
      case 'Retailer':
        return {
          title: 'Retail Overview',
          primaryMetric: 'Products in Stock',
          secondaryMetric: 'Sales Orders',
          color: '#f57c00'
        };
      default:
        return {
          title: 'Overview',
          primaryMetric: 'Products',
          secondaryMetric: 'Orders',
          color: '#7b1fa2'
        };
    }
  };

  const dashboard = getRoleDashboard();

  const pieData = [
    { name: 'Active', value: stats.activeProducts, color: '#4caf50' },
    { name: 'In Transit', value: Math.floor(stats.totalProducts * 0.3), color: '#ff9800' },
    { name: 'Delivered', value: Math.floor(stats.totalProducts * 0.4), color: '#2196f3' },
    { name: 'Sold', value: stats.totalProducts - stats.activeProducts, color: '#9c27b0' },
  ];

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {getGreeting()}, {user?.name}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {dashboard.title} • {user?.role} • {user?.company}
            </Typography>
          </Box>
          <IconButton onClick={fetchDashboardData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Inventory sx={{ color: dashboard.color, mr: 1 }} />
                <Typography color="text.secondary" gutterBottom>
                  {dashboard.primaryMetric}
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.totalProducts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.activeProducts} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart sx={{ color: dashboard.color, mr: 1 }} />
                <Typography color="text.secondary" gutterBottom>
                  {dashboard.secondaryMetric}
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.pendingOrders} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: dashboard.color, mr: 1 }} />
                <Typography color="text.secondary" gutterBottom>
                  Growth Rate
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                +12%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                vs last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Notifications sx={{ color: dashboard.color, mr: 1 }} />
                <Typography color="text.secondary" gutterBottom>
                  Notifications
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {getUnreadCount()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                unread messages
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Activity Overview
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={recentActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="products" 
                  stroke={dashboard.color} 
                  name="Products"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#ff7300" 
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Product Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Product Status
            </Typography>
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Notifications
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {notifications.slice(0, 5).map((notification) => (
                <Box key={notification.id} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {notification.title}
                    </Typography>
                    <Chip 
                      label={notification.type} 
                      size="small" 
                      color={notification.read ? 'default' : 'primary'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              ))}
              {notifications.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent notifications
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {user?.role === 'Manufacturer' && (
                <Grid item xs={6}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Inventory sx={{ fontSize: 40, color: dashboard.color, mb: 1 }} />
                      <Typography variant="h6">Create Product</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              <Grid item xs={6}>
                <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <QrCode sx={{ fontSize: 40, color: dashboard.color, mb: 1 }} />
                    <Typography variant="h6">Scan QR</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <ShoppingCart sx={{ fontSize: 40, color: dashboard.color, mb: 1 }} />
                    <Typography variant="h6">View Orders</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: dashboard.color, mb: 1 }} />
                    <Typography variant="h6">Analytics</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;