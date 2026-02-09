import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          const profile = await authService.getProfile();
          if (profile?.success) {
            const refreshedUser = {
              id: profile.data.id,
              email: profile.data.email,
              fullName: profile.data.fullName,
              role: profile.data.role,
              tenantId: profile.data.tenantId
            };
            localStorage.setItem('user', JSON.stringify(refreshedUser));
            setUser(refreshedUser);
          }
        } catch (error) {
          console.error('Error validating session:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password, subdomain) => {
    const response = await authService.login(email, password, subdomain);
    if (response.success) {
      setUser(response.data.user);
      return response;
    }
    throw new Error(response.message);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
