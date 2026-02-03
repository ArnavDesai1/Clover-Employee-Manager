import React, { createContext, useState, useContext, useEffect } from 'react';
import authAPI from '../services/authAPI';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('employeeManager_user');
    const storedToken = localStorage.getItem('employeeManager_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // TODO: Validate token with backend on app load
        // await authAPI.getCurrentUser();
      } catch (e) {
        localStorage.removeItem('employeeManager_user');
        localStorage.removeItem('employeeManager_token');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      // Call auth API (currently mocked, ready for backend)
      const response = await authAPI.signIn(email, password);
      
      if (response.data.success) {
        const userData = response.data.user;
        const token = response.data.token;
        
        setUser(userData);
        localStorage.setItem('employeeManager_user', JSON.stringify(userData));
        localStorage.setItem('employeeManager_token', token);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: response.data.error || 'Sign in failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'An error occurred during sign in' 
      };
    }
  };

  const signInWithGoogle = async (googleCredential) => {
    try {
      const response = await authAPI.signInWithGoogle(googleCredential);
      
      if (response.data.success) {
        const userData = response.data.user;
        const token = response.data.token;
        
        setUser(userData);
        localStorage.setItem('employeeManager_user', JSON.stringify(userData));
        localStorage.setItem('employeeManager_token', token);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: response.data.error || 'Google sign in failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'An error occurred during Google sign in' 
      };
    }
  };

  const signOut = async () => {
    try {
      // Call backend to invalidate token
      await authAPI.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('employeeManager_user');
      localStorage.removeItem('employeeManager_token');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
