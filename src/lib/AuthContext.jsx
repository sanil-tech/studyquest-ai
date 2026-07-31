import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      let publicSettings = null;
      if (appParams.appId) {
        try {
          const appClient = createAxiosClient({
            baseURL: `/api/apps/public`,
            headers: {
              'X-App-Id': appParams.appId
            },
            token: appParams.token,
            interceptResponses: true
          });
          publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        } catch (appError) {
          console.warn('Public settings unavailable or non-critical error:', appError);
          if (appError.status === 403 && appError.data?.extra_data?.reason) {
            const reason = appError.data.extra_data.reason;
            if (reason === 'auth_required') {
              setAuthError({ type: 'auth_required', message: 'Authentication required' });
              setIsLoadingPublicSettings(false);
              setIsLoadingAuth(false);
              return;
            } else if (reason === 'user_not_registered') {
              setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
              setIsLoadingPublicSettings(false);
              setIsLoadingAuth(false);
              return;
            }
          }
        }
      }
      setAppPublicSettings(publicSettings);

      const hasChildSession = localStorage.getItem('studyquest_session');
      if (appParams.token || hasChildSession) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.warn('Non-blocking error in checkAppState:', error);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      
      const sessionData = localStorage.getItem('studyquest_session');
      const storedUser = localStorage.getItem('studyquest_user');
      
      if (sessionData && storedUser) {
        try {
          const session = JSON.parse(sessionData);
          const parsedUser = JSON.parse(storedUser);
          
          // Memanggil entiti secara klien biasa untuk pengesahan ID anak
          const verifiedUser = await base44.entities.User.get(session.userId).catch(() => null);
          
          if (verifiedUser && !verifiedUser.account_locked) {
            setUser(verifiedUser);
            setIsAuthenticated(true);
            setIsLoadingAuth(false);
            setAuthChecked(true);
            return;
          } 
          
          if (parsedUser && !parsedUser.account_locked) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            setIsLoadingAuth(false);
            setAuthChecked(true);
            return;
          }
        } catch (sessionError) {
          localStorage.removeItem('studyquest_session');
          localStorage.removeItem('studyquest_user');
        }
      }
      
      if (appParams.token) {
        try {
          const currentUser = await base44.auth.me();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (meError) {
          console.warn('base44.auth.me() check failed:', meError);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('studyquest_session');
    localStorage.removeItem('studyquest_user');
    // Clear view-mode state so next login defaults to parent mode
    localStorage.removeItem('studyquest_view_mode');
    localStorage.removeItem('studyquest_selected_child');
    localStorage.removeItem('active_child_session');
    localStorage.removeItem('selected_child_id');
    localStorage.removeItem('active_student_id');
    localStorage.removeItem('active_student_name');
    localStorage.removeItem('active_child');

    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};