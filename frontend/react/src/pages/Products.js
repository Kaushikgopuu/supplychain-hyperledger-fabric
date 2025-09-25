import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Search, QrCode, Edit, Transfer } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';
import QRCode from 'react-qr-code';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState('');
  const [newProduct, setNewProduct] = useState({
    id: '',
    name: '',
    description: '',
    category: '',
    price: '',
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getMyProducts();
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await productsAPI.createProduct(newProduct);
      if (response.data.success) {
        setOpenCreateDialog(false);
        setNewProduct({ id: '', name: '', description: '', category: '', price: '' });
        fetchProducts();
      }
    } catch (err) {
      setError('Failed to create product');
    }
  };

  const showQRCode = (qrCode) => {
    setSelectedQRCode(qrCode);
    setOpenQRDialog(true);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || product.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        {user?.role === 'Manufacturer' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Product
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Created">Created</MenuItem>
              <MenuItem value="InTransit">In Transit</MenuItem>
              <MenuItem value="Delivered">Delivered</MenuItem>
              <MenuItem value="Sold">Sold</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" noWrap>
                    {product.name}
                  </Typography>
                  <Chip 
                    label={product.status} 
                    color={getStatusColor(product.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  ID: {product.id}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {product.description}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Category: {product.category}
                </Typography>
                
                <Typography variant="h6" color="primary">
                  ${product.price}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  View Details
                </Button>
                <Button 
                  size="small" 
                  startIcon={<QrCode />}
                  onClick={() => showQRCode(product.qrCode)}
                >
                  QR Code
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProducts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'Manufacturer' ? 'Create your first product to get started.' : 'No products available.'}
          </Typography>
        </Paper>
      )}

      {/* Create Product Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreateProduct}>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Product ID"
                  value={newProduct.id}
                  onChange={(e) => setNewProduct({...newProduct, id: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Product</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)}>
        <DialogTitle>Product QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            {selectedQRCode && (
              <QRCode value={selectedQRCode} size={256} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;