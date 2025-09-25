import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Save, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    location: user?.location || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setSuccess('Profile updated successfully');
    } else {
      setError(result.message || 'Failed to update profile');
    }
    
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar 
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}
            >
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.role}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Paper>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  User ID
                </Typography>
                <Typography variant="body2">
                  {user?.id}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body2">
                  {user?.role}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body2">
                  {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Edit Profile
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={user?.role}
                    disabled
                    helperText="Role cannot be changed"
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;