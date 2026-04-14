import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; 
import { db } from '../firebaseConfig';

const isWeb = Platform.OS === 'web';

export default function DailyBusinessScreen() {
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ revenue: 0, orders: 0, cod: 0, online: 0 });

  useEffect(() => {
    // 🟢 REAL-TIME LISTENER (Syncs instantly)
    // We fetch ALL orders because filtering by Date string in Firestore is tricky
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      let revenue = 0;
      let count = 0;
      let codTotal = 0;
      let onlineTotal = 0;
      
      const todayStr = new Date().toLocaleDateString('en-GB'); // Match your DD/MM/YYYY format

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Check if order date matches TODAY
        if (data.deliveryDate === todayStr && data.status !== 'Cancelled') {
           const total = data.items?.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0) || 0;
           revenue += total;
           count++;
           
           if (data.paymentType === 'COD') codTotal += total;
           else onlineTotal += total;
        }
      });

      setTodayStats({ revenue, orders: count, cod: codTotal, online: onlineTotal });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if(loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0f172a" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* PAGE HEADER */}
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>Daily Business</Text>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString('en-GB')}</Text>
        </View>
      </View>
      
      {/* STATS GRID */}
      <View style={styles.grid}>
        
        {/* Total Revenue Card */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="cash-outline" size={20} color="#0f172a" />
          </View>
          <Text style={styles.label}>TOTAL REVENUE</Text>
          <Text style={styles.value}>₹ {todayStats.revenue.toLocaleString()}</Text>
        </View>

        {/* Total Orders Card */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="cart-outline" size={20} color="#0f172a" />
          </View>
          <Text style={styles.label}>ORDERS TODAY</Text>
          <Text style={styles.value}>{todayStats.orders}</Text>
        </View>

        {/* COD Split */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="wallet-outline" size={20} color="#0f172a" />
          </View>
          <Text style={styles.label}>CASH (COD)</Text>
          <Text style={styles.value}>₹ {todayStats.cod.toLocaleString()}</Text>
        </View>

        {/* Online Split */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="card-outline" size={20} color="#0f172a" />
          </View>
          <Text style={styles.label}>ONLINE PAYMENTS</Text>
          <Text style={styles.value}>₹ {todayStats.online.toLocaleString()}</Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: '#f8fafc',
    height: isWeb ? '100vh' : '100%' 
  },
  
  // Header
  pageHeader: { 
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#0f172a', 
    letterSpacing: -0.5 
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: '#334155', 
    fontWeight: '600',
  },
  
  // Grid & Cards
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16 
  },
  card: { 
    width: isWeb ? '48.5%' : '47%', // Fits 2 per row
    padding: 24, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    backgroundColor: 'white',
    flexGrow: 1
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  label: { 
    fontSize: 10, 
    color: '#94a3b8', 
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4
  },
  value: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#0f172a',
    letterSpacing: -0.5
  },

  // Loading
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});