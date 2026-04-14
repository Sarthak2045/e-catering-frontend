import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, FlatList 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/theme';
import { updateDoc, doc } from 'firebase/firestore'; 
import { db } from '../firebaseConfig';

const isWeb = Platform.OS === 'web';

export default function OrderDetailScreen({ route, navigation }) {
  // 1. Get the order data passed from Dashboard
  const { order } = route.params; 
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);

  // --- ACTIONS ---
  const handleUpdateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { status: newStatus });
      setCurrentStatus(newStatus); // Update UI instantly
      if(newStatus === 'Completed') navigation.goBack(); // Auto-close on complete
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
    setLoading(false);
  };

  // --- RENDER HELPERS ---
  const renderDetailRow = (label, value, icon) => (
    <View style={styles.detailRow}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  const renderStatusBadge = () => {
    let bg = colors.primary;
    if (currentStatus === 'Active') bg = colors.warning;
    if (currentStatus === 'Completed') bg = colors.success;
    if (currentStatus === 'Cancelled') bg = colors.error;

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={styles.statusText}>{currentStatus}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.pnr || 'Unknown'}</Text>
        {renderStatusBadge()}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={isWeb ? styles.webLayout : styles.mobileLayout}>
          
          {/* --- LEFT COLUMN: DETAILS --- */}
          <View style={[styles.card, isWeb && { flex: 1, marginRight: 20 }]}>
            <Text style={styles.sectionTitle}>Passenger Details</Text>
            <View style={styles.divider} />
            
            <View style={styles.grid}>
               {renderDetailRow("Vendor", order.vendorName, "store")}
               {renderDetailRow("PNR Number", order.pnr, "ticket-confirmation")}
               {renderDetailRow("Train Info", order.trainInfo, "train")}
               {renderDetailRow("Coach / Seat", `${order.coach || '-'} / ${order.seat || '-'}`, "seat")}
               {renderDetailRow("Contact", order.contactNo, "phone")}
               {renderDetailRow("Order Date", new Date(order.createdAt?.seconds * 1000).toLocaleDateString(), "calendar")}
            </View>
          </View>

          {/* --- RIGHT COLUMN: ITEMS & ACTIONS --- */}
          <View style={[styles.card, isWeb && { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.divider} />

            {/* ITEM LIST */}
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyText}>{item.quantity}x</Text>
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                </View>
              ))
            ) : (
              <Text style={{color: 'gray', fontStyle: 'italic'}}>No items listed</Text>
            )}

            <View style={styles.divider} />
            
            {/* TOTAL */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{order.totalAmount || 0}</Text>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.actionContainer}>
              {currentStatus !== 'Completed' && (
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: colors.success }]}
                  onPress={() => handleUpdateStatus('Completed')}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>✅ Mark Complete</Text>
                </TouchableOpacity>
              )}

              {currentStatus !== 'Cancelled' && (
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: colors.error, marginTop: 10 }]}
                  onPress={() => handleUpdateStatus('Cancelled')}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>❌ Cancel Order</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, 
    backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border 
  },
  backBtn: { padding: 8, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  scrollContent: { padding: 20 },
  webLayout: { flexDirection: 'row', alignItems: 'flex-start', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  mobileLayout: { flexDirection: 'column' },

  card: { backgroundColor: colors.surface, borderRadius: 10, padding: 20, marginBottom: 20, ...shadows.medium },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 10 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailRow: { width: isWeb ? '50%' : '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  label: { fontSize: 12, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: colors.text },

  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  qtyBox: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 10 },
  qtyText: { fontWeight: 'bold', color: colors.primary },
  itemName: { flex: 1, fontSize: 15, color: colors.text },
  itemPrice: { fontWeight: 'bold', fontSize: 15, color: colors.text },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: colors.textSecondary },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: colors.primary },

  actionContainer: { marginTop: 10 },
  btn: { padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});