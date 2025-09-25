import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  QrCodeScanner,
  Close,
  Verified,
  Warning,
  History,
  Business,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';
import QrScanner from 'qr-scanner';
import { qrAPI } from '../services/api';
import QRCode from 'react-qr-code';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [qrResult, setQrResult] = useState('');
  const [productData, setProductData] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setShowScanner(true);
      setScanning(true);
      setError('');

      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            handleScanResult(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        await qrScannerRef.current.start();
      }
    } catch (err) {
      setError('Failed to start camera. Please ensure camera permissions are granted.');
      setScanning(false);
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
    setShowScanner(false);
  };

  const handleScanResult = async (data) => {
    setQrResult(data);
    stopScanner();
    await fetchProductData(data);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setQrResult(manualInput.trim());
      await fetchProductData(manualInput.trim());
    }
  };

  const fetchProductData = async (qrData) => {
    setLoading(true);
    setError('');
    setProductData(null);
    setProductHistory([]);

    try {
      const response = await qrAPI.scanQRCode(qrData);
      
      if (response.data.success) {
        setProductData(response.data.data.product);
        setProductHistory(response.data.data.history);
      } else {
        setError('Invalid QR code or product not found');
      }
    } catch (err) {
      setError('Failed to validate QR code. Please try again.');
      console.error('QR scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'created':
        return 'info';
      case 'intransit':
        return 'warning';
      case 'delivered':
        return 'success';
      case 'sold':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center' }}>
          Product Traceability Scanner
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
          Scan QR codes to verify product authenticity and view supply chain history
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Scanner Controls */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<QrCodeScanner />}
              onClick={startScanner}
              disabled={scanning}
            >
              {scanning ? 'Scanner Active' : 'Start QR Scanner'}
            </Button>

            <Button
              variant="outlined"
              onClick={stopScanner}
              disabled={!scanning}
            >
              Stop Scanner
            </Button>

            <Box component="form" onSubmit={handleManualSubmit} sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
              <TextField
                fullWidth
                placeholder="Or paste QR code data here"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                size="small"
              />
              <Button type="submit" variant="outlined">
                Verify
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* QR Scanner Dialog */}
        <Dialog
          open={showScanner}
          onClose={stopScanner}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            QR Code Scanner
            <IconButton
              aria-label="close"
              onClick={stopScanner}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
              {scanning && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body1">
                    Point your camera at a QR code
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* QR Result Display */}
        {qrResult && !loading && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Scanned QR Code Data
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {qrResult}
            </Box>
          </Paper>
        )}

        {/* Product Information */}
        {productData && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Verified sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h5" color="success.main">
                Authentic Product Verified
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Product Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Product ID
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {productData.id}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {productData.name}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {productData.description}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {productData.category}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip 
                        label={productData.status} 
                        color={getStatusColor(productData.status)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Owner
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Owner ID
                      </Typography>
                      <Typography variant="body1">
                        {productData.owner}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(productData.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(productData.updatedAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Price
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${productData.price}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Product History */}
        {productHistory.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <History sx={{ mr: 1 }} />
              <Typography variant="h6">
                Supply Chain History
              </Typography>
            </Box>

            {productHistory.map((entry, index) => (
              <Box key={index}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" color="primary">
                          {entry.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Transaction ID: {entry.txId}
                        </Typography>
                      </Box>
                      <Chip 
                        label={entry.action} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Timestamp
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {formatDate(entry.timestamp)}
                        </Typography>
                      </Grid>

                      {entry.from && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              From
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {entry.from}
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            To
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {entry.to}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Location
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {entry.location || 'Not specified'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {entry.description && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body2">
                          {entry.description}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
                {index < productHistory.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </Paper>
        )}

        {/* Navigation */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{ mr: 2 }}
          >
            Login to Dashboard
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setQrResult('');
              setProductData(null);
              setProductHistory([]);
              setError('');
            }}
          >
            Clear Results
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

// Import Grid component
import { Grid } from '@mui/material';

export default QRScanner;