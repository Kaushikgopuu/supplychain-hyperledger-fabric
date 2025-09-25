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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, QrCode, Edit, Transfer, History } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';
import QRCode from 'react-qr-code';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [transferData, setTransferData] = useState({
    newOwner: '',
    location: '',
    description: '',
  });
  const [statusData, setStatusData] = useState({
    status: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    fetchProductDetails();
    fetchProductHistory();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await productsAPI.getProductById(id);
      if (response.data.success) {
        setProduct(response.data.data);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to fetch product details');
      console.error('Fetch product error:', err);
    }
  };

  const fetchProductHistory = async () => {
    try {
      const response = await productsAPI.getProductHistory(id);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.transferProduct(id, transferData);
      setOpenTransferDialog(false);
      setTransferData({ newOwner: '', location: '', description: '' });
      fetchProductDetails();
      fetchProductHistory();
    } catch (err) {
      setError('Failed to transfer product');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.updateProductStatus(id, statusData);
      setOpenStatusDialog(false);
      setStatusData({ status: '', location: '', description: '' });
      fetchProductDetails();
      fetchProductHistory();
    } catch (err) {
      setError('Failed to update product status');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'created': return 'info';
      case 'intransit': return 'warning';
      case 'delivered': return 'success';
      case 'sold': return 'default';
      default: return 'default';
    }
  };

  const getTimelineDotColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'created': return 'primary';
      case 'transferred': return 'secondary';
      case 'statusupdate': return 'info';
      default: return 'grey';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box>
        <Alert severity="error">{error || 'Product not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/products')} sx={{ mt: 2 }}>
          Back to Products
        </Button>
      </Box>
    );
  }

  const canTransfer = product.owner === user?.id;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/products')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">Product Details</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Product Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {product.name}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Product ID
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {product.id}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {product.description}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Category
              </Typography>
              <Typography variant="body1">
                {product.category}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Price
              </Typography>
              <Typography variant="h6" color="primary">
                ${product.price}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={product.status} 
                color={getStatusColor(product.status)}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Current Owner
              </Typography>
              <Typography variant="body1">
                {product.owner}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2">
                {new Date(product.createdAt).toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2">
                {new Date(product.updatedAt).toLocaleString()}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<QrCode />}
                onClick={() => setOpenQRDialog(true)}
              >
                Show QR Code
              </Button>
              
              {canTransfer && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Transfer />}
                    onClick={() => setOpenTransferDialog(true)}
                  >
                    Transfer
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setOpenStatusDialog(true)}
                  >
                    Update Status
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Product History */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <History sx={{ mr: 1 }} />
              <Typography variant="h6">Supply Chain History</Typography>
            </Box>

            <Timeline>
              {history.map((entry, index) => (
                <TimelineItem key={index}>
                  <TimelineSeparator>
                    <TimelineDot color={getTimelineDotColor(entry.action)} />
                    {index < history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {entry.action}
                    </Typography>
                    <Typography color="text.secondary">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      {entry.description}
                    </Typography>
                    {entry.location && (
                      <Typography variant="caption" color="text.secondary">
                        Location: {entry.location}
                      </Typography>
                    )}
                    {entry.from && entry.to && entry.from !== entry.to && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        From: {entry.from} → To: {entry.to}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>
      </Grid>

      {/* QR Code Dialog */}
      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)}>
        <DialogTitle>Product QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            <QRCode value={product.qrCode || ''} size={256} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Scan this QR code to verify product authenticity
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleTransfer}>
          <DialogTitle>Transfer Product</DialogTitle>
          <DialogContent>
            <TextField
              required
              fullWidth
              label="New Owner ID"
              value={transferData.newOwner}
              onChange={(e) => setTransferData({...transferData, newOwner: e.target.value})}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              required
              fullWidth
              label="Location"
              value={transferData.location}
              onChange={(e) => setTransferData({...transferData, location: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={transferData.description}
              onChange={(e) => setTransferData({...transferData, description: e.target.value})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Transfer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleStatusUpdate}>
          <DialogTitle>Update Product Status</DialogTitle>
          <DialogContent>
            <TextField
              required
              fullWidth
              select
              label="Status"
              value={statusData.status}
              onChange={(e) => setStatusData({...statusData, status: e.target.value})}
              sx={{ mb: 2, mt: 1 }}
              SelectProps={{ native: true }}
            >
              <option value="">Select Status</option>
              <option value="Created">Created</option>
              <option value="InTransit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Sold">Sold</option>
            </TextField>
            <TextField
              required
              fullWidth
              label="Location"
              value={statusData.location}
              onChange={(e) => setStatusData({...statusData, location: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={statusData.description}
              onChange={(e) => setStatusData({...statusData, description: e.target.value})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Update Status</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProductDetails;