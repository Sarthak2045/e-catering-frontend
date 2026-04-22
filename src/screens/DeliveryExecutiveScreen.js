import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, Modal, ScrollView
} from 'react-native';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';



export default function DeliveryExecutiveScreen() {
  const [executives, setExecutives]     = useState([]);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName]         = useState('');
  const [formCommission, setFormCommission] = useState('');
  const [formSaving, setFormSaving]     = useState(false);

  // Filters
  const [search, setSearch] = useState('');

  // ── Firebase ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubExecs = onSnapshot(collection(db, 'executives'), (snap) => {
      setExecutives(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubOrders = onSnapshot(query(collection(db, 'orders')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubExecs(); unsubOrders(); };
  }, []);

  // ── Add Executive ─────────────────────────────────────────────────────────
  const handleAddExecutive = async () => {
    if (!formName.trim() || !formCommission.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const commVal = parseFloat(formCommission);
    if (isNaN(commVal) || commVal < 0) {
      Alert.alert('Error', 'Enter a valid commission value.');
      return;
    }
    setFormSaving(true);
    try {
      await addDoc(collection(db, 'executives'), {
        name: formName.trim(),
        commission: commVal,
        createdAt: new Date().toISOString(),
      });
      setFormName(''); setFormCommission('');
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not add executive. Try again.');
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete Executive ──────────────────────────────────────────────────────
  const handleDelete = (id, name) => {
    const doDelete = async () => {
      try { await deleteDoc(doc(db, 'executives', id)); }
      catch { Alert.alert('Error', 'Could not delete executive.'); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${name} from the delivery team?`)) doDelete();
    } else {
      Alert.alert('Remove Executive', `Remove ${name} from the delivery team?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: doDelete, style: 'destructive' },
      ]);
    }
  };

  // ── Stats per Executive ───────────────────────────────────────────────────
  const getStats = (execId) => {
    const execOrders = orders.filter(o =>
      o.assignedExecutiveId === execId && o.status === 'Completed'
    );
    const codOrders  = execOrders.filter(o => o.paymentType === 'COD');
    const codTotal   = codOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const commission = execOrders.length * (executives.find(e=>e.id===execId)?.commission || 0);
    return {
      delivered:   execOrders.length,
      commission:  commission,
      codTotal:    codTotal,
      codOrders:   codOrders.length,
      totalComm:   commission,
    };
  };


  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = executives.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }


  return (
    <View style={styles.screen}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Delivery Executives</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color="white" />
          <Text style={styles.addButtonText}>ADD DELIVERY EXECUTIVE</Text>
        </TouchableOpacity>
      </View>

      {/* ── Toolbar ── */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* ── Table ── */}
      <View style={styles.tableWrapper}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.5 }]}>Id</Text>
          <Text style={[styles.th, { flex: 1.8 }]}>Delivery Executive Name</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Successfully Order{'\n'}Delivered</Text>
          <Text style={[styles.th, { flex: 1 }]}>Commission</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>COD Orders{'\n'}Total</Text>
          <Text style={[styles.th, { flex: 1 }]}>COD Orders</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Total{'\n'}Commission</Text>
          <Text style={[styles.th, { flex: 1 }]}>Actions</Text>
        </View>

        {/* Table Rows */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No delivery executives found.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const stats = getStats(item.id);
            const isEven = index % 2 === 0;
            return (
              <View style={[styles.tableRow, !isEven && styles.tableRowAlt]}>
                <Text style={[styles.td, styles.tdBold, { flex: 0.5 }]}>{index + 1}</Text>
                <Text style={[styles.td, styles.tdBold, { flex: 1.8 }]}>{item.name}</Text>
                <Text style={[styles.td, styles.tdBold, { flex: 1.2 }]}>{stats.delivered}</Text>
                <Text style={[styles.td, styles.tdBold, { flex: 1 }]}>{item.commission ?? 0}</Text>
                <Text style={[styles.td, styles.tdBold, { flex: 1.2 }]}>₹{stats.codTotal.toFixed(2)}</Text>
                <Text style={[styles.td, styles.tdBold, { flex: 1 }]}>{stats.codOrders}</Text>
                <Text style={[styles.td, styles.tdBold, { flex: 1.2 }]}>₹{stats.totalComm.toFixed(2)}</Text>

                {/* Actions */}
                <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Ionicons name="trash-outline" size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>

      {/* ── Add Executive Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Executive</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setFormName(''); setFormCommission(''); }}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Name Field */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ankit Sharma"
              placeholderTextColor="#9ca3af"
              value={formName}
              onChangeText={setFormName}
            />

            {/* Commission Field */}
            <Text style={styles.label}>Commission per Delivery (₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 45"
              placeholderTextColor="#9ca3af"
              value={formCommission}
              onChangeText={setFormCommission}
              keyboardType="numeric"
            />

            {/* Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setFormName(''); setFormCommission(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, formSaving && { opacity: 0.6 }]}
                onPress={handleAddExecutive}
                disabled={formSaving}
              >
                {formSaving
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={styles.saveBtnText}>Add Executive</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#f1f5f9', padding: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle:     { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  addButton:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  addButtonText: { color: 'white', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },

  // Toolbar
  toolbar:         { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minWidth: 200 },
  searchInput:     { flex: 1, fontSize: 14, color: '#0f172a', outlineStyle: 'none' },

  // Table
  tableWrapper: { flex: 1, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  tableHeader:  { flexDirection: 'row', backgroundColor: '#111827', paddingVertical: 14, paddingHorizontal: 16 },
  th:           { fontSize: 12, fontWeight: '700', color: 'white', letterSpacing: 0.3, textAlign: 'center' },

  tableRow:     { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  tableRowAlt:  { backgroundColor: '#fafafa' },
  td:           { fontSize: 14, color: '#374151', textAlign: 'center', alignItems: 'center', justifyContent: 'center' },
  tdBold:       { fontWeight: '700', color: '#111827' },

  emptyRow:     { paddingVertical: 40, alignItems: 'center' },
  emptyText:    { color: '#94a3b8', fontSize: 14 },

  // Delete Button
  deleteBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 6, borderWidth: 1, borderColor: '#fecaca' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:    { backgroundColor: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  label:        { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  modalInput:   { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 13, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 18, outlineStyle: 'none' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:{ fontSize: 14, fontWeight: '600', color: '#374151' },
  saveBtn:      { flex: 1, backgroundColor: '#111827', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:  { fontSize: 14, fontWeight: '700', color: 'white' },
});
