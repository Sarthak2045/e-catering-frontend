import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';

export default function DeliveryExecutiveScreen() {
  const [executives, setExecutives] = useState([]);
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubExecs = onSnapshot(collection(db, 'executives'), (snap) => {
      setExecutives(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubOrders = onSnapshot(query(collection(db, 'orders')), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => { unsubExecs(); unsubOrders(); };
  }, []);

  const handleAddExecutive = async () => {
    if (!name || !phone) return Alert.alert("Error", "Please fill in all fields.");
    await addDoc(collection(db, 'executives'), { name, phone, createdAt: new Date().toISOString() });
    setName(''); setPhone('');
  };

  // 🟢 NEW: Secure Delete Function
  const handleDeleteExecutive = (id, execName) => {
    const doDelete = async () => {
      try {
        await deleteDoc(doc(db, 'executives', id));
      } catch (error) {
        Alert.alert("Error", "Could not delete executive.");
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to remove ${execName} from the delivery team?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Remove Executive",
        `Are you sure you want to remove ${execName} from the delivery team?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", onPress: doDelete, style: "destructive" }
        ]
      );
    }
  };

  const getExecStats = (execId) => {
    const execOrders = orders.filter(o => o.assignedExecutiveId === execId && o.status === 'Completed');
    const cashCollected = execOrders.filter(o => o.paymentType === 'COD').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { deliveries: execOrders.length, cash: cashCollected };
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0f172a" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Delivery Team</Text>
      
      <View style={styles.addCard}>
        <Text style={styles.cardTitle}>Add New Executive</Text>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#94a3b8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddExecutive}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={executives}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const stats = getExecStats(item.id);
          return (
            <View style={styles.execCard}>
              
              {/* TOP ROW: Info & Delete Button */}
              <View style={styles.execTopRow}>
                <View style={styles.execInfo}>
                  <Ionicons name="person-circle" size={42} color="#94a3b8" />
                  <View>
                    <Text style={styles.execName}>{item.name}</Text>
                    <Text style={styles.execPhone}>{item.phone}</Text>
                  </View>
                </View>

                {/* 🟢 NEW: Delete Button */}
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDeleteExecutive(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {/* BOTTOM ROW: Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>DELIVERIES</Text>
                  <Text style={styles.statValue}>{stats.deliveries}</Text>
                </View>
                <View style={[styles.statBox, {backgroundColor: '#f0fdf4', borderColor: '#bbf7d0'}]}>
                  <Text style={styles.statLabel}>CASH HELD</Text>
                  <Text style={[styles.statValue, {color: '#16a34a'}]}>₹{stats.cash}</Text>
                </View>
              </View>

            </View>
          );
        }}
        ListEmptyComponent={<Text style={{color: '#94a3b8', textAlign: 'center', marginTop: 20}}>No delivery executives added yet.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 20, letterSpacing: -0.5 },
  
  // Add Executive Card
  addCard: { backgroundColor: 'white', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 12, letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a', borderRadius: 6, padding: 12, backgroundColor: '#f8fafc', fontSize: 14 },
  addBtn: { backgroundColor: '#0f172a', justifyContent: 'center', paddingHorizontal: 24, borderRadius: 6 },
  addBtnText: { color: 'white', fontWeight: '700', letterSpacing: 0.5 },
  
  // Executive List Card
  execCard: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    marginBottom: 12 
  },
  execTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 16
  },
  execInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  execName: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: 0.3 },
  execPhone: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  
  // Delete Button
  deleteBtn: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca'
  },

  // Stats
  statsContainer: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 6 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginBottom: 6, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' }
});