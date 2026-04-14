import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, logoutUser } from '../services/api'; 
// Note: We use the functions from api.js which now wrap Firebase

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (Persist Login)
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error('Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (email, password) => {
    try {
      // Call the new Firebase-based login function
      const response = await apiLogin(email, password);
      
      // Store user details
      // Note: api.js now returns { user: {...}, token: ... } directly
      const userData = response.user;
      
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', response.token);
      
      return true;
    } catch (error) {
      console.error("Login Context Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser(); // Sign out from Firebase
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);