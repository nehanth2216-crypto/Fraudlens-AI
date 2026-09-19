import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fraudlens_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const storedName = localStorage.getItem('fraudlens_user_name');
      const storedUser = localStorage.getItem('fraudlens_user');
      let parsedStoredUser = null;
      try {
        parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {}

      authAPI.me().then(res => {
        const userData = res.data;
        if (storedName) {
          userData.name = storedName;
        } else if (parsedStoredUser?.name) {
          userData.name = parsedStoredUser.name;
        }
        setUser(userData);
        setLoading(false);
      }).catch(() => {
        logout();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password, customName = null) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user: userData } = res.data;
    if (customName && customName.trim()) {
      userData.name = customName.trim();
      localStorage.setItem('fraudlens_user_name', customName.trim());
    }
    localStorage.setItem('fraudlens_token', access_token);
    localStorage.setItem('fraudlens_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role) => {
    const res = await authAPI.register({ name, email, password, role });
    const { access_token, user: userData } = res.data;
    if (name && name.trim()) {
      localStorage.setItem('fraudlens_user_name', name.trim());
    }
    localStorage.setItem('fraudlens_token', access_token);
    localStorage.setItem('fraudlens_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('fraudlens_token');
    localStorage.removeItem('fraudlens_user');
    localStorage.removeItem('fraudlens_user_name');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
