import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  LinearProgress,
  Fade
} from '@mui/material';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [isNewUser, setIsNewUser] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Check if email exists using our API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/check-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );
      
      const data = await response.json();
      setIsNewUser(!data.exists);
      setStep('password');
    } catch (err: any) {
      // If check fails, assume existing user to be safe
      setIsNewUser(false);
      setStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      if (isNewUser) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      // Auth context will handle redirect via auth state change
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Incorrect password');
      } else if (err.message?.includes('already registered')) {
        // User exists but we thought they were new - try login instead
        try {
          await login(email, password);
        } catch (loginErr: any) {
          setError('Incorrect password');
        }
      } else if (err.message?.includes('Password should be at least')) {
        setError('Password must be at least 6 characters');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setPassword('');
    setError('');
    setIsNewUser(false);
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            width: '100%',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {loading && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0 
              }} 
            />
          )}
          
          <Typography component="h1" variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
            Welcome to Mycontext
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 3, textAlign: 'center' }}
          >
            {step === 'email' 
              ? 'Enter your email to continue'
              : isNewUser 
                ? 'Create your account'
                : 'Welcome back! Enter your password'
            }
          </Typography>
          
          {error && (
            <Fade in>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}
          
          {step === 'email' ? (
            <Box component="form" onSubmit={handleEmailSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={loading}
                error={!!error}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !email}
                endIcon={<ArrowRight size={18} />}
              >
                Continue
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handlePasswordSubmit}>
              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={<ArrowLeft size={18} />}
                  onClick={handleBack}
                  disabled={loading}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  Back
                </Button>
                
                <TextField
                  fullWidth
                  value={email}
                  disabled
                  variant="filled"
                  label="Email"
                  sx={{ mb: 2 }}
                />
              </Box>
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={isNewUser ? "Create Password" : "Password"}
                type="password"
                id="password"
                autoComplete={isNewUser ? 'new-password' : 'current-password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                disabled={loading}
                error={!!error}
                helperText={
                  isNewUser 
                    ? "Use at least 6 characters" 
                    : error ? null : "Enter your password"
                }
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !password || password.length < 6}
              >
                {loading 
                  ? 'Loading...' 
                  : isNewUser 
                    ? 'Create Account' 
                    : 'Sign In'
                }
              </Button>

              {!isNewUser && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block', 
                    textAlign: 'center',
                    mt: 2 
                  }}
                >
                  Forgot password? Contact support
                </Typography>
              )}
            </Box>
          )}
        </Paper>
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 4, textAlign: 'center' }}
        >
          By continuing, you agree to our Terms of Service
        </Typography>
      </Box>
    </Container>
  );
};