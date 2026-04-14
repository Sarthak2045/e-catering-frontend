import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  Alert, Modal
} from 'react-native';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function MenuScreen() {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const catUnsub = onSnapshot(query(collection(db, 'categories'), orderBy('name')), (snap) => {
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0].id);
    });

    const menuUnsub = onSnapshot(query(collection(db, 'menuItems'), orderBy('name')), (snap) => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { catUnsub(); menuUnsub(); };
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addDoc(collection(db, 'categories'), { name: newCategoryName.trim() });
    setNewCategoryName('');
    Alert.alert('Success', 'Category Added!');
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice || !selectedCategory) {
      Alert.alert('Error', 'Please fill all fields and select a category');
      return;
    }
    await addDoc(collection(db, 'menuItems'), {
      name: newItemName,
      price: parseFloat(newItemPrice),
      categoryId: selectedCategory,
      isVeg: true
    });
    setModalVisible(false);
    setNewItemName('');
    setNewItemPrice('');
  };

  const handleDelete = async (col, id) => {
    if (confirm('Delete this item?')) {
      await deleteDoc(doc(db, col, id));
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.pageHeader}>
        <Text style={styles.header}>Menu Management</Text>
        <Text style={styles.headerSub}>
          {categories.length} categories · {menuItems.length} items
        </Text>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('categories')}
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list-outline"
            size={14}
            color={activeTab === 'categories' ? '#0f172a' : '#94a3b8'}
          />
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
            Categories
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('items')}
          style={[styles.tab, activeTab === 'items' && styles.activeTab]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="restaurant-outline"
            size={14}
            color={activeTab === 'items' ? '#0f172a' : '#94a3b8'}
          />
          <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
            Menu Items
          </Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORIES VIEW */}
      {activeTab === 'categories' && (
        <View style={styles.content}>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="New category name (e.g. Starters)"
              placeholderTextColor="#cbd5e1"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyText}>No categories yet</Text>
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Text style={styles.indexNumber}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.listText}>{item.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete('categories', item.id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={15} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* ITEMS VIEW */}
      {activeTab === 'items' && (
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.bigAddBtn}
            onPress={() => {
              if (categories.length === 0) {
                Alert.alert('Error', 'Please add a Category first!');
                return;
              }
              setModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="white" />
            <Text style={styles.bigAddBtnText}>Add New Dish</Text>
          </TouchableOpacity>

          {menuItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyText}>No menu items yet</Text>
            </View>
          ) : (
            <FlatList
              data={menuItems}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const catName = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
                return (
                  <View style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <View style={[styles.vegIndicator, { backgroundColor: item.isVeg ? '#16a34a' : '#dc2626' }]} />
                      <View>
                        <Text style={styles.listText}>{item.name}</Text>
                        <Text style={styles.subText}>{catName} · ₹{item.price}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete('menuItems', item.id)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={15} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* MODAL FOR ADDING ITEM */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Dish</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                style={styles.picker}
              >
                {categories.map(cat => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.modalLabel}>Dish Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Paneer Tikka"
              placeholderTextColor="#cbd5e1"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <Text style={styles.modalLabel}>Price (₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 250"
              placeholderTextColor="#cbd5e1"
              keyboardType="numeric"
              value={newItemPrice}
              onChangeText={setNewItemPrice}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddItem}>
                <Ionicons name="checkmark" size={14} color="white" />
                <Text style={styles.modalSaveText}>Save Dish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },

  pageHeader: { marginBottom: 20 },
  header: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 3, fontWeight: '500' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabText: { fontWeight: '600', color: '#94a3b8', fontSize: 13 },
  activeTabText: { color: '#0f172a' },

  content: { flex: 1 },

  // Add Row
  addRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 11,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#0f172a',
    padding: 11,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },

  // List
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 7,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  indexNumber: { fontSize: 11, fontWeight: '700', color: '#cbd5e1', width: 22 },
  listText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  subText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  vegIndicator: { width: 8, height: 8, borderRadius: 4 },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  bigAddBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0f172a',
    padding: 13,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bigAddBtnText: { color: 'white', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#94a3b8' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    width: '90%',
    maxWidth: 420,
    borderRadius: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  modalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  pickerBorder: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 7,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    marginBottom: 14,
  },
  picker: { height: 48, width: '100%' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 7,
    marginBottom: 14,
    fontSize: 14,
    color: '#0f172a',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalCancelText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  modalSaveBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  modalSaveText: { color: 'white', fontWeight: '700', fontSize: 13 },
});
