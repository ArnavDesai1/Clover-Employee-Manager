import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './SignIn.css';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);

  const from = location.state?.from?.pathname || '/';

  const getPostLoginPath = (user) => {
    if (user?.role === 'Employee') return '/employee';
    return from && from !== '/signin' ? from : '/';
  };

  useEffect(() => {
    // Load Google Identity Services only if Client ID is configured
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      setGoogleConfigured(false);
      return;
    }
    setGoogleConfigured(true);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        // auto_select: false = don't auto-pick the last-used account (show chooser).
        // button_auto_select: false = button flow always shows account chooser, never auto-sign-in.
        // Add your app URL (e.g. http://localhost:3000) to Authorized JavaScript origins in
        // Google Cloud Console, or you get origin_mismatch and the error page shows the browser's signed-in email.
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          button_auto_select: false,
          ux_mode: 'popup',
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
          });
        }
      }
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignIn = async (response) => {
    setError('');
    setLoading(true);

    try {
      // Decode JWT token (in production, send to backend for validation)
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const result = await signInWithGoogle({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });

      if (result.success) {
        navigate(getPostLoginPath(result.user), { replace: true });
      } else {
        setError(result.error || 'Google sign in failed');
      }
    } catch (err) {
      setError('An error occurred during Google sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const nextEmail = (email || '').trim();
      if (!nextEmail) {
        setError('Enter your email above, then use Mock Google Sign-In.');
        return;
      }

      const result = await signInWithGoogle({
        email: nextEmail,
        name: nextEmail.split('@')[0],
      });

      if (result.success) {
        const target = result.user?.role === 'Employee' ? '/employee' : (from || '/');
        navigate(target, { replace: true });
      } else {
        setError(result.error || 'Google sign in failed');
      }
    } catch (err) {
      setError('An error occurred during Google sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn(email, password);
      if (result.success) {
        navigate(getPostLoginPath(result.user), { replace: true });
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <div className="signin-logo">
            <img src="/clover-logo.png" alt="Clover Infotech" className="signin-logo-img" />
          </div>
          <h1 className="signin-title">Employee Manager</h1>
          <p className="signin-subtitle">Sign in to access employee records</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {error && <div className="signin-error">{error}</div>}

          <div className="signin-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@cloverinfotech.com"
              required
              autoFocus
            />
          </div>

          <div className="signin-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="signin-link">Forgot password?</Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="signin-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="signin-divider">
          <span>OR</span>
        </div>

        <div className="signin-google">
          {googleConfigured ? (
            <>
              <div ref={googleButtonRef}></div>
              <p className="signin-google-note">Use your Google account (@cloverinfotech.com)</p>
            </>
          ) : (
            <>
              <button
                type="button"
                className="signin-google-mock"
                onClick={handleMockGoogleSignIn}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Mock Google Sign-In'}
              </button>
              <p className="signin-google-note">
                Google Sign-In not configured (set <code>REACT_APP_GOOGLE_CLIENT_ID</code>). Mock uses the email field above.
              </p>
            </>
          )}
        </div>

        <div className="signin-footer">
          <p className="signin-note">
            <strong>Note:</strong> Access is restricted to Clover Infotech employees only.
          </p>
          <p className="signin-help">
            For access issues, contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
