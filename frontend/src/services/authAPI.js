import axios from 'axios';
import { isBlockedEmail } from '../config/accessControl';

// Local: empty = proxy to backend. Production (Vercel): set REACT_APP_API_URL to your Render backend URL.
const API_BASE = process.env.REACT_APP_API_URL || '';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  // Sign in (email/password) – uses backend when available
  signIn: async (email, password) => {
    if (isBlockedEmail(email)) {
      return { data: { success: false, error: 'This account has been blocked. Contact admin.' } };
    }
    try {
      const res = await axiosInstance.post('/api/auth/signin', { email, password });
      const data = res.data;
      if (data.success && data.user) {
        return { data: { success: true, token: data.token, user: data.user } };
      }
      return { data: { success: false, error: data.error || 'Sign in failed' } };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      const fallback = 'Invalid email or password';
      return {
        data: {
          success: false,
          error: msg || fallback,
        },
      };
    }
  },

  // Google Sign In
  signInWithGoogle: async (googleCredential) => {
    // TODO: Replace with actual backend endpoint
    // Example: return axiosInstance.post('/auth/google', { credential: googleCredential });
    
    const email = googleCredential.email;
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (isBlockedEmail(normalizedEmail)) {
      return {
        data: {
          success: false,
          error: 'This account has been blocked. Contact admin.',
        },
      };
    }
    const emailDomain = normalizedEmail.split('@')[1]?.toLowerCase();
    const isCloverEmail = emailDomain === 'cloverinfotech.com';

    // Google: allow @cloverinfotech.com (any role) + allowlisted external (e.g. arnav as Employee)
    const allowlistedUsers = [
      { email: 'theelemental0@gmail.com', role: 'Admin' },
      { email: 'arnav.desai@somaiya.edu', role: 'Employee' },
    ];
    const allowlisted = allowlistedUsers.find((u) => u.email === normalizedEmail);
    const isAllowed = isCloverEmail || !!allowlisted;

    if (!isAllowed) {
      return {
        data: {
          success: false,
          error: 'Access restricted to Clover Infotech employees only. Use a @cloverinfotech.com or allowlisted account.',
        },
      };
    }

    const adminEmails = ['admin@cloverinfotech.com', 'hr@cloverinfotech.com', 'manager@cloverinfotech.com'];
    const isAdmin = adminEmails.includes(normalizedEmail) || allowlisted?.role === 'Admin';

    return {
      data: {
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: Math.floor(Math.random() * 1000),
          email: email,
          name: googleCredential.name || email.split('@')[0],
          role: isAdmin ? 'Admin' : 'Employee',
          organization: isCloverEmail ? 'Clover Infotech' : 'External (Temp Allowlist)',
          picture: googleCredential.picture,
        },
      },
    };
  },

  // Forgot password: backend sends real email when MAIL_USERNAME/MAIL_PASSWORD are set
  forgotPassword: async (email) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return { data: { success: false, error: 'Email is required' } };
    }
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password', { email: normalizedEmail });
      return {
        data: {
          success: true,
          message: res.data?.message || "If an account exists with this email, you'll receive reset instructions shortly.",
          resetLink: res.data?.resetLink,
        },
      };
    } catch (err) {
      return {
        data: {
          success: true,
          message: "If an account exists with this email, you'll receive reset instructions shortly.",
        },
      };
    }
  },

  // Reset password with token from email link (backend validates token)
  resetPassword: async (token, newPassword) => {
    if (!token || !newPassword) {
      return { data: { success: false, error: 'Reset link and password are required' } };
    }
    try {
      const res = await axiosInstance.post('/api/auth/reset-password', { token, newPassword });
      const data = res.data;
      if (data.success) {
        return { data: { success: true, message: data.message } };
      }
      return { data: { success: false, error: data.error || 'Failed to reset password' } };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      return { data: { success: false, error: msg || 'Something went wrong. The link may have expired.' } };
    }
  },

  // Sign out
  signOut: async () => {
    // TODO: Call backend to invalidate token
    // Example: return axiosInstance.post('/auth/signout');
    return { data: { success: true } };
  },

  // Get current user (validate token)
  getCurrentUser: async () => {
    // TODO: Call backend to validate token and get user info
    // Example: return axiosInstance.get('/auth/me');
    return { data: { user: null } };
  },
};

export default authAPI;
