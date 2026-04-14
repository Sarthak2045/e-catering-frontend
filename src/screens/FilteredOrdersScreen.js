import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';

export default function FilteredOrdersScreen({ statusFilter, title }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch orders that match the requested status (Completed or Cancelled)
    const q = query(collection(db, "orders"), where("status", "==", statusFilter));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually to avoid compound index requirement in Firebase
      liveOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setOrders(liveOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [statusFilter]);

  const SimpleOrderCard = ({ order }) => (
    <View style={styles.orderCard}>
      <View style={styles.headerRow}>
        <Text style={styles.orderId}>#{order.orderNo}</Text>
        <Text style={styles.amount}>₹{order.totalAmount}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.vendor}>{order.vendorName}</Text>
        
        {/* Shows the delivery person if it was assigned before delivery/cancellation */}
        {order.assignedExecutiveName && (
          <View style={styles.execBadge}>
            <Ionicons name="bicycle" size={12} color="#16a34a" />
            <Text style={styles.execText}>{order.assignedExecutiveName}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0f172a" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{title}</Text>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SimpleOrderCard order={item} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={32} color="#cbd5e1" />
            <Text style={styles.emptyText}>No orders found in this category.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, height: Platform.OS === 'web' ? '100vh' : '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 20, letterSpacing: -0.5 },
  orderCard: { backgroundColor: 'white', padding: 18, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: 0.3 },
  amount: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vendor: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  execBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  execText: { fontSize: 10, fontWeight: '800', color: '#16a34a', letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' }
});