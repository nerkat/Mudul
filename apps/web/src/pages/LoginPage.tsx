import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  const { loginWithGoogle, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const nextPath = searchParams.get('next') || '/';
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Clear stale auth errors when opening the page
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setLocalError('Google did not return a credential token.');
      return;
    }

    clearError();
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle({ credential: response.credential, rememberMe: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setLocalError('Google sign-in was cancelled or unavailable.');
  };

  const activeError = localError || error?.message || null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Mudul
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Continue with Google to access your workspace
          </Typography>
        </Box>

        {activeError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {activeError}
            {error?.details && error.details.length > 0 && (
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {error.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </Box>
            )}
          </Alert>
        )}

        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Google Sign-In
          </Typography>
        </Divider>

        {!googleClientId ? (
          <Alert severity="warning">
            Google sign-in is unavailable because VITE_GOOGLE_CLIENT_ID is not configured.
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 1,
              mb: 2,
              minHeight: 44,
              opacity: isSubmitting ? 0.64 : 1,
              pointerEvents: isSubmitting ? 'none' : 'auto'
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
            />
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Your first Google sign-in creates a personal workspace automatically.
          </Typography>
        </Box>

        {isSubmitting && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}