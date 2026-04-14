import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import WebLayout from '../components/WebLayout';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OrdersListScreen from '../screens/OrdersListScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import AddOrderScreen from '../screens/AddOrderScreen';
import MenuScreen from '../screens/MenuScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const isWeb = Platform.OS === 'web';

function OrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OrdersList" component={OrdersListScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function AddOrderStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AddOrderForm" component={AddOrderScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'AddOrder') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'food' : 'food-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'chart-line' : 'chart-line-variant';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-text-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="AddOrder" component={AddOrderStack} options={{ tabBarLabel: 'Add Order' }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ tabBarLabel: 'Menu' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarLabel: 'Reports' }} />
      <Tab.Screen name="Orders" component={OrdersStack} options={{ tabBarLabel: 'Orders' }} />
    </Tab.Navigator>
  );
}

// Web-specific Stack Navigator with Sidebar
function WebMainStack() {
  const [currentRoute, setCurrentRoute] = React.useState('Dashboard');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      screenListeners={({ navigation, route }) => ({
        state: (e) => {
          // FIX: Get the route name directly from the event state
          const state = e.data.state;
          if (state) {
            const routeName = state.routes[state.index].name;
            setCurrentRoute(routeName);
          }
        },
      })}
    >
      <Stack.Screen name="Dashboard">
        {(props) => (
          <WebLayout {...props} currentRoute={currentRoute}>
            <DashboardScreen {...props} />
          </WebLayout>
        )}
      </Stack.Screen>
      <Stack.Screen name="AddOrder">
        {(props) => (
          <WebLayout {...props} currentRoute={currentRoute}>
            <AddOrderScreen {...props} />
          </WebLayout>
        )}
      </Stack.Screen>
      <Stack.Screen name="Menu">
        {(props) => (
          <WebLayout {...props} currentRoute={currentRoute}>
            <MenuScreen {...props} />
          </WebLayout>
        )}
      </Stack.Screen>
      <Stack.Screen name="Reports">
        {(props) => (
          <WebLayout {...props} currentRoute={currentRoute}>
            <ReportsScreen {...props} />
          </WebLayout>
        )}
      </Stack.Screen>
      <Stack.Screen name="Orders">
        {(props) => (
          <WebLayout {...props} currentRoute={currentRoute}>
            <OrdersListScreen {...props} />
          </WebLayout>
        )}
      </Stack.Screen>
      <Stack.Screen name="OrderDetail">
        {(props) => (
          <WebLayout {...props} currentRoute="Orders">
            <OrderDetailScreen {...props} />
          </WebLayout>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainContent() {
  if (isWeb) {
    return <WebMainStack />;
  }
  return <MainTabs />;
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <Stack.Screen name="Main" component={MainContent} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
