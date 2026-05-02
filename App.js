import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 

import { auth } from './src/firebaseConfig'; 

import DashboardScreen from './src/screens/DashboardScreen';
import DailyBusinessScreen from './src/screens/DailyBusinessScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import LoginScreen from './src/screens/LoginScreen'; 
import AddOrderScreen from './src/screens/AddOrderScreen';
import MenuScreen from './src/screens/MenuScreen';
import DeliveryExecutiveScreen from './src/screens/DeliveryExecutiveScreen'; 
import FilteredOrdersScreen from './src/screens/FilteredOrdersScreen'; 

export default function App() {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('Dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "See you soon!");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const renderContent = () => {
    switch (currentScreen) {
      case 'Dashboard': return <DashboardScreen />;
      case 'Daily Business': return <DailyBusinessScreen />;
      case 'Add Order': return <AddOrderScreen />;
      case 'Menu': return <MenuScreen />;
      case 'Reports': return <ReportsScreen />;
      case 'Delivered': return <FilteredOrdersScreen statusFilter="Completed" title="Delivered Orders" />;
      case 'Cancelled': return <FilteredOrdersScreen statusFilter="Cancelled" title="Cancelled Orders" />;
      case 'Delivery Team': return <DeliveryExecutiveScreen />;
      default: return <DashboardScreen />;
    }
  };

  const SidebarItem = ({ icon, label, isActive }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isActive && styles.activeMenuItem]} 
      onPress={() => setCurrentScreen(label)}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={20} color={isActive ? "#0f172a" : "#94a3b8"} />
      <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{label}</Text>
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layout}>
        
        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <View>
            <View style={styles.logoContainer}>
              <View style={styles.logoIconBox}>
                <Ionicons name="restaurant" size={20} color="white" />
              </View>
              <Text style={styles.logoText}>Samrat POS</Text>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.sectionHeading}>MAIN MENU</Text>
              <SidebarItem icon="cash-outline" label="Daily Business" isActive={currentScreen === 'Daily Business'} />
              <SidebarItem icon="add-circle-outline" label="Add Order" isActive={currentScreen === 'Add Order'} />
              <SidebarItem icon="restaurant-outline" label="Menu" isActive={currentScreen === 'Menu'} />
              <SidebarItem icon="bar-chart-outline" label="Reports" isActive={currentScreen === 'Reports'} />
              <SidebarItem icon="bicycle-outline" label="Delivery Team" isActive={currentScreen === 'Delivery Team'} />
              <SidebarItem icon="grid-outline" label="Active" isActive={currentScreen === 'Dashboard'} />
              <SidebarItem icon="checkmark-circle-outline" label="Delivered" isActive={currentScreen === 'Delivered'} />
              <SidebarItem icon="close-circle-outline" label="Cancelled" isActive={currentScreen === 'Cancelled'} />
            </View>
          </View>

          <View style={styles.footerSection}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {renderContent()}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    height: Platform.OS === 'web' ? '100vh' : '100%' 
  },
  layout: { 
    flex: 1, 
    flexDirection: 'row' 
  },
  sidebar: { 
    width: 260, 
    backgroundColor: 'white', 
    paddingVertical: 24, 
    borderRightWidth: 1, 
    borderRightColor: '#e2e8f0', 
    justifyContent: 'space-between' 
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 40, 
    paddingHorizontal: 24, 
    gap: 12 
  },
  logoIconBox: {
    backgroundColor: '#0f172a',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoText: { 
    color: '#0f172a', 
    fontSize: 20, 
    fontWeight: '800',
    letterSpacing: -0.5 
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 24,
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    marginBottom: 4, 
    gap: 14,
    position: 'relative'
  },
  activeMenuItem: { 
    backgroundColor: '#f8fafc' 
  },
  menuText: { 
    color: '#64748b', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  activeMenuText: { 
    color: '#0f172a', 
    fontWeight: '700' 
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: '#0f172a',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4
  },
  footerSection: {
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderRadius: 8, 
    gap: 10 
  },
  logoutText: { 
    color: '#ef4444', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  content: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    overflow: 'hidden' 
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});
