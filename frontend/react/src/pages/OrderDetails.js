import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { ArrowBack, Edit, Cancel } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI } from '../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await ordersAPI.getOrderById(id);
      if (response.data.success) {
        setOrder(response.data.data);
        setNewStatus(response.data.data.status);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to fetch order details');
      console.error('Fetch order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await ordersAPI.updateOrderStatus(id, newStatus);
      setOpenStatusDialog(false);
      fetchOrderDetails();
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const handleCancelOrder = async () => {
    try {
      await ordersAPI.cancelOrder(id);
      fetchOrderDetails();
    } catch (err) {
      setError('Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canUpdateStatus = order && (order.buyerId === user?.id || order.sellerId === user?.id);
  const canCancel = order && ['Pending', 'Confirmed'].includes(order.status) && 
                   (order.buyerId === user?.id || order.sellerId === user?.id);

  const statusOptions = [
    'Pending',
    'Confirmed', 
    'Shipped',
    'Delivered',
    'Completed',
    'Cancelled'
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box>
        <Alert severity="error">{error || 'Order not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
          Back to Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">Order Details</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Order Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Order ID
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {order.id}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Product ID
              </Typography>
              <Typography variant="body1">
                {order.productId}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Quantity
              </Typography>
              <Typography variant="body1">
                {order.quantity}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Price
              </Typography>
              <Typography variant="h6" color="primary">
                ${order.totalPrice}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={order.status} 
                color={getStatusColor(order.status)}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Tracking ID
              </Typography>
              <Typography variant="body1">
                {order.trackingId}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="body2">
                {new Date(order.orderDate).toLocaleString()}
              </Typography>
            </Box>

            {order.deliveryDate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Delivery Date
                </Typography>
                <Typography variant="body2">
                  {new Date(order.deliveryDate).toLocaleString()}
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}>
              {canUpdateStatus && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setOpenStatusDialog(true)}
                >
                  Update Status
                </Button>
              )}
              
              {canCancel && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Parties Information */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            {/* Buyer Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Buyer Information
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {order.buyerId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Buyer ID
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Seller Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Seller Information
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {order.sellerId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Seller ID
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                    <Typography variant="body2">
                      Quantity:
                    </Typography>
                    <Typography variant="body2">
                      {order.quantity}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                    <Typography variant="body2">
                      Unit Price:
                    </Typography>
                    <Typography variant="body2">
                      ${(order.totalPrice / order.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'between', fontWeight: 'bold' }}>
                    <Typography variant="body1">
                      Total:
                    </Typography>
                    <Typography variant="body1" color="primary">
                      ${order.totalPrice}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mt: 1 }}
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetails;