import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import DailyBusinessScreen from '../screens/DailyBusinessScreen';

export default function WebLayout({ children, navigation, currentRoute }) {
  const { user, logout } = useAuth();
  const [showDailyBusiness, setShowDailyBusiness] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: 'view-dashboard', route: 'Dashboard' },
    { name: 'Daily Business', icon: 'cash-multiple', action: () => setShowDailyBusiness(true) },
    { name: 'Add Order', icon: 'plus-circle', route: 'AddOrder' },
    { name: 'Menu', icon: 'food-fork-drink', route: 'Menu' },
    { name: 'Reports', icon: 'chart-box', route: 'Reports' },
    { name: 'Orders', icon: 'receipt', route: 'Orders' },
  ];

  const handleMenuClick = (item) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const isActive = (routeName) => currentRoute === routeName;

  return (
    <View style={styles.container}>
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <MaterialCommunityIcons name="train" size={32} color="white" />
          <Text style={styles.appTitle}>e-Catering</Text>
        </View>

        <ScrollView style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isActive(item.route) && styles.menuItemActive,
              ]}
              onPress={() => handleMenuClick(item)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={22}
                color={isActive(item.route) ? 'white' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.menuText,
                  isActive(item.route) && styles.menuTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'A'}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
              <Text style={styles.userRole}>Administrator</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
        {children}
      </View>

      <DailyBusinessScreen
        visible={showDailyBusiness}
        onClose={() => setShowDailyBusiness(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    width: 260,
    backgroundColor: colors.primary, // Solid Dark Sidebar
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sidebarHeader: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: colors.secondary, // Bright Blue for active
  },
  menuText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  menuTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)', // Slightly darker footer
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userDetails: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  userRole: {
    fontSize: 11,
    color: '#94A3B8',
  },
  logoutButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden', // Ensures inner scroll views work right
  },
});