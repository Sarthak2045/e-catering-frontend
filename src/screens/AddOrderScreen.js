import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions
} from 'react-native';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const isWeb = Dimensions.get('window').width > 768;

// 🟢 Full Vendor List
const VENDOR_LIST = [
  'Direct', 'IRCTC3', 'RAILOFY', 'Food_Train', 'Go_Food', 'IRCTC', 'OLF',
  'Rail_Food', 'Rail_Restro', 'Rail_Yatri', 'Rajdhani', 'Yatri_Bhojan',
  'Zoop_India', 'Travel_Khana', 'Khana_Online', 'Train_Bhojan', 'Rail_Recipe',
  'Etos', 'Rail_Meal', 'SpicyWagon', 'Traveler_Food', 'Jd_Food', 'Hotel_Janki',
  'Rajbhog', 'Dibrail', 'nStore', 'IRCTC_RR', 'RailFeast', 'Comesum',
  'YatriRestro', 'HomeBytes'
].sort();

const RadioButton = ({ label, selected, onSelect }) => (
  <TouchableOpacity style={styles.radioContainer} onPress={onSelect} activeOpacity={0.7}>
    <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
      {selected && <View style={styles.radioInnerCircle} />}
    </View>
    <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
  </TouchableOpacity>
);

export default function AddOrderScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);

  const [orderId] = useState(Date.now().toString());
  const [vendorName, setVendorName] = useState(VENDOR_LIST[0]);
  const [trainNo, setTrainNo] = useState('');
  const [coach, setCoach] = useState('');
  const [seat, setSeat] = useState('');
  const [pnr, setPnr] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [remark, setRemark] = useState('');
  const [orderType, setOrderType] = useState('Vegetarian');
  const [paymentType, setPaymentType] = useState('COD');
  const [deliveryTime] = useState(new Date().toLocaleString());

  const [cart, setCart] = useState([]);
  const [deliveryChargeInput, setDeliveryChargeInput] = useState('0');
  const [gstPercent, setGstPercent] = useState('5');
  const [discountPercent, setDiscountPercent] = useState('0');

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'categories'), orderBy('name')), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(data);
      if (data.length > 0) setSelectedCat(data[0].id);
    });
    const u2 = onSnapshot(query(collection(db, 'menuItems'), orderBy('name')), snap => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { u1(); u2(); };
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(p => p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p)
        .filter(p => p.quantity > 0)
    );
  };

  const subTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const delivery = parseFloat(deliveryChargeInput) || 0;
  const tax = (subTotal * (parseFloat(gstPercent) || 0)) / 100;
  const discount = (subTotal * (parseFloat(discountPercent) || 0)) / 100;
  const totalAmount = Math.round(subTotal + tax + delivery - discount);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return Alert.alert('Error', 'Cart is empty');
    if (!customerName) return Alert.alert('Error', 'Customer Name is required');

    const orderData = {
      orderNo: orderId,
      vendorName, customerName, contactNo: mobileNo,
      trainInfo: trainNo, coach, seat: seat, pnr,
      orderType, paymentType,
      remark: remark,
      orderDate: new Date().toISOString().split('T')[0],
      orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      subTotal, tax, deliveryCharge: delivery, totalAmount,
      status: 'Active', createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'orders'), orderData);
    Alert.alert('Success', 'Order Placed!');
    navigation.goBack();
  };

  const renderInput = (label, value, onChange, placeholder, keyboard = 'default', editable = true) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.disabledInput]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        keyboardType={keyboard}
        editable={editable}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={18} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Order</Text>
        </View>
        <Text style={styles.orderIdBadge}>#{orderId.slice(-6)}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainLayout}>

          {/* SECTION 1: Order Details */}
          <View style={[styles.card, styles.leftCard]}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleDot} />
              <Text style={styles.cardTitle}>Order Details</Text>
            </View>
            <View style={styles.formGrid}>
              {renderInput('Order ID (Auto)', orderId, null, '', 'default', false)}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vendor Name</Text>
                <View style={styles.pickerBorder}>
                  <Picker selectedValue={vendorName} onValueChange={setVendorName} style={styles.picker}>
                    {VENDOR_LIST.map(v => <Picker.Item key={v} label={v} value={v} />)}
                  </Picker>
                </View>
              </View>

              {renderInput('Train Number & Name', trainNo, setTrainNo, 'Train Number & Name')}
              {renderInput('Coach Number', coach, setCoach, 'Coach Number')}
              {renderInput('Seat Number', seat, setSeat, 'Seat Number')}
              {renderInput('PNR', pnr, setPnr, 'PNR')}
              {renderInput('Customer Name', customerName, setCustomerName, 'Customer Name')}
              {renderInput('Mobile No', mobileNo, setMobileNo, 'Mobile Number', 'phone-pad')}
              {renderInput('Remark / Special Instructions', remark, setRemark, 'e.g., No onion/garlic')}
              {renderInput('Delivery Time', deliveryTime, null, '', 'default', false)}
            </View>

            <View style={styles.radioSection}>
              <View style={styles.radioGroup}>
                <Text style={styles.radioGroupLabel}>Order Type</Text>
                <View style={styles.radioRow}>
                  <RadioButton label="Vegetarian" selected={orderType === 'Vegetarian'} onSelect={() => setOrderType('Vegetarian')} />
                  <RadioButton label="Non-Veg" selected={orderType === 'Non Vegetarian'} onSelect={() => setOrderType('Non Vegetarian')} />
                </View>
              </View>
              <View style={styles.radioGroup}>
                <Text style={styles.radioGroupLabel}>Payment Type</Text>
                <View style={styles.radioRow}>
                  <RadioButton label="COD" selected={paymentType === 'COD'} onSelect={() => setPaymentType('COD')} />
                  <RadioButton label="ONLINE" selected={paymentType === 'ONLINE'} onSelect={() => setPaymentType('ONLINE')} />
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 2: Order Overview */}
          <View style={[styles.card, styles.rightCard]}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleDot} />
              <Text style={styles.cardTitle}>Order Overview</Text>
              {cart.length > 0 && (
                <View style={styles.cartCountBadge}>
                  <Text style={styles.cartCountText}>{cart.length}</Text>
                </View>
              )}
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>ITEM NAME</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>QTY</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>RATE</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={28} color="#cbd5e1" />
                <Text style={styles.emptyCartText}>No items selected</Text>
              </View>
            ) : (
              cart.map(item => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.cartItemName, { flex: 2 }]}>{item.name}</Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.cartCell, { flex: 1, textAlign: 'right' }]}>₹{item.price}</Text>
                  <Text style={[styles.cartCell, { flex: 1, textAlign: 'right', fontWeight: '700', color: '#0f172a' }]}>
                    ₹{item.price * item.quantity}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* SECTION 3: Add Items */}
          <View style={[styles.card, styles.leftCard, { minHeight: 360 }]}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleDot} />
              <Text style={styles.cardTitle}>Add Items</Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', minHeight: 300 }}>
              {/* Category Sidebar */}
              <View style={styles.categorySidebar}>
                <Text style={styles.sidebarHeading}>CATEGORY</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catItem, selectedCat === cat.id && styles.catItemActive]}
                      onPress={() => setSelectedCat(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Items Grid */}
              <View style={styles.itemsPanel}>
                <Text style={styles.sidebarHeading}>ITEMS</Text>
                <ScrollView contentContainerStyle={styles.itemGrid} showsVerticalScrollIndicator={false}>
                  {menuItems.filter(m => m.categoryId === selectedCat).map(item => (
                    <TouchableOpacity key={item.id} style={styles.itemBox} onPress={() => addToCart(item)} activeOpacity={0.75}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <View style={styles.itemFooter}>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                        <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#16a34a' : '#dc2626' }]} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* SECTION 4: Pricing Details */}
          <View style={[styles.card, styles.rightCard]}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleDot} />
              <Text style={styles.cardTitle}>Pricing Details</Text>
            </View>
            <View style={styles.formGrid}>
              {renderInput('Sub Total', subTotal.toFixed(2), null, '', 'default', false)}
              {renderInput('Delivery Charges', deliveryChargeInput, setDeliveryChargeInput, '0', 'numeric')}
              {renderInput('GST (1–100)%', gstPercent, setGstPercent, '5', 'numeric')}
              {renderInput('Discount (1–100)%', discountPercent, setDiscountPercent, '0', 'numeric')}
            </View>

            <View style={styles.totalBar}>
              <Text style={styles.totalLabel}>AMOUNT TO COLLECT</Text>
              <Text style={styles.totalValue}>₹ {totalAmount.toFixed(2)}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handlePlaceOrder}>
          <Ionicons name="checkmark" size={16} color="white" />
          <Text style={styles.saveBtnText}>PLACE ORDER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  orderIdBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  container: { flex: 1 },
  scrollContent: { padding: 20 },
  mainLayout: { flexDirection: isWeb ? 'row' : 'column', flexWrap: 'wrap', gap: 20 },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  leftCard: { width: isWeb ? '48.5%' : '100%' },
  rightCard: { width: isWeb ? '48.5%' : '100%' },

  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitleDot: { width: 3, height: 16, backgroundColor: '#0f172a', borderRadius: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },
  cartCountBadge: {
    backgroundColor: '#0f172a',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  cartCountText: { color: 'white', fontSize: 10, fontWeight: '800' },

  // Form
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  inputGroup: { width: isWeb ? '30%' : '47%', marginBottom: 4, flexGrow: 1 },
  label: { fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 5, letterSpacing: 0.3 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 11,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  disabledInput: { backgroundColor: '#f1f5f9', color: '#94a3b8' },

  pickerBorder: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  picker: { height: 40, width: '100%' },

  radioSection: { flexDirection: 'row', gap: 24, marginTop: 16, flexWrap: 'wrap' },
  radioGroup: { gap: 8 },
  radioGroupLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', letterSpacing: 0.3 },
  radioRow: { flexDirection: 'row', gap: 16 },
  radioContainer: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  radioCircle: {
    height: 17,
    width: 17,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: { borderColor: '#0f172a' },
  radioInnerCircle: { height: 9, width: 9, borderRadius: 5, backgroundColor: '#0f172a' },
  radioLabel: { fontSize: 13, color: '#64748b' },
  radioLabelSelected: { color: '#0f172a', fontWeight: '600' },

  // Cart Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  th: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.7 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  cartItemName: { fontSize: 13, color: '#0f172a', fontWeight: '500' },
  cartCell: { fontSize: 13, color: '#334155' },
  emptyCart: {
    alignItems: 'center',
    gap: 8,
    padding: 32,
  },
  emptyCartText: { color: '#94a3b8', fontSize: 13 },
  qtyBtn: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  qtyBtnText: { fontSize: 14, color: '#0f172a', fontWeight: '700', lineHeight: 16 },
  qtyValue: { fontSize: 13, fontWeight: '700', color: '#0f172a', minWidth: 16, textAlign: 'center' },

  // Item Browser
  categorySidebar: {
    width: '30%',
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
    paddingRight: 12,
  },
  sidebarHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  catItem: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  catItemActive: { backgroundColor: '#0f172a' },
  catText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  catTextActive: { color: 'white', fontWeight: '700' },
  itemsPanel: { width: '70%', paddingLeft: 14 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  itemBox: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    backgroundColor: 'white',
  },
  itemName: { fontSize: 12, fontWeight: '500', color: '#0f172a', marginBottom: 8, lineHeight: 16 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  vegDot: { width: 9, height: 9, borderRadius: 5 },

  // Pricing
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  totalLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  totalValue: { fontSize: 18, fontWeight: '800', color: 'white' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  saveBtn: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
});
