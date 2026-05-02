import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Platform, TouchableOpacity, TextInput, ScrollView
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Expandable Row — mirrors DashboardScreen's ExpandableOrderRow exactly
// ─────────────────────────────────────────────────────────────────────────────
const ExpandableOrderRow = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const isCancelled = item.status === 'Cancelled';
  const isCompleted = item.status === 'Completed';

  const badgeBg     = isCancelled ? '#fef2f2'  : isCompleted ? '#f0fdf4'  : '#fffbeb';
  const badgeTxt    = isCancelled ? '#dc2626'  : isCompleted ? '#16a34a'  : '#b45309';
  const badgeBorder = isCancelled ? '#fecaca'  : isCompleted ? '#bbf7d0'  : '#fde68a';

 const codTypes        = ['COD', 'CASH', 'CASH_ON_DELIVERY'];
 const isCOD           = codTypes.includes((item.paymentType || '').toUpperCase().replace(/\s+/g, '_'));
 const paymentColor    = isCOD ? '#b45309' : '#0f766e';
 const paymentLabel    = isCOD ? 'COD' : 'ONLINE';
 const amountToCollect = isCOD ? (item.totalAmount || 0) : 0;

  return (
    <View style={styles.cardContainer}>
      {/* ── Collapsed / summary row ── */}
      <TouchableOpacity
        style={[styles.tableRow, expanded && styles.tableRowExpanded]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.85}
      >
        {/* Chevron */}
        <View style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#94a3b8"
          />
        </View>

        {/* Status badge */}
        <View style={{ flex: 0.8 }}>
          <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: badgeTxt, letterSpacing: 0.5 }}>
              {item.status || 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Order No */}
        <Text style={[styles.cell, { flex: 1.1, fontWeight: '700', color: '#0f172a' }]}>
          {item.orderNo}
        </Text>

        {/* Date */}
       <Text style={[styles.cell, { flex: 1.0, fontSize: 12 }]}>{item.deliveryDate || '—'}</Text>
        <Text style={[styles.cell, { flex: 0.8, fontSize: 12, fontWeight: '500' }]}>{item.deliveryTime || '—'}</Text>
        {/* Vendor */}
        <Text style={[styles.cell, { flex: 1.2 }]} numberOfLines={1}>
          {item.vendorName}
        </Text>

        {/* Train / Coach / Seat */}
        <Text style={[styles.cell, { flex: 1.2 }]} numberOfLines={2}>
          {item.trainInfo || 'N/A'}{' '}
          <Text style={{ color: '#dc2626', fontWeight: '700' }}>
            ({item.coach || 'No Coach'}{item.seat ? ` / ${item.seat}` : ''})
          </Text>
        </Text>

        {/* Payment tag */}
        <View style={{ flex: 0.9 }}>
          <Text style={[styles.paymentTag, { color: paymentColor, borderColor: paymentColor }]}>
             {paymentLabel}
          </Text>
        </View>

        {/* Delivery executive (read-only indicator, no action buttons needed on history screens) */}
        <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[
            styles.dotIndicator,
            { backgroundColor: item.assignedExecutiveName ? '#16a34a' : '#cbd5e1' }
          ]} />
          <Text
            style={[
              styles.cell,
              {
                fontSize: 12,
                fontWeight: '700',
                flex: 1,
                color: item.assignedExecutiveName ? '#16a34a' : '#94a3b8',
              }
            ]}
            numberOfLines={1}
          >
            {item.assignedExecutiveName || 'Not Assigned'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ── Expanded detail panel — identical to Dashboard's 3-column layout ── */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedLayout}>

            {/* LEFT — Item list */}
            <View style={styles.expandSectionLeft}>
              <View style={styles.miniTableHeader}>
                <Text style={[styles.miniHeadText, { flex: 1 }]}>ITEM NAME</Text>
                <Text style={[styles.miniHeadText, { width: 56, textAlign: 'center' }]}>QTY</Text>
              </View>
              {item.items && item.items.map((prod, idx) => (
                <View key={idx} style={styles.miniTableRow}>
                  <Text style={[styles.miniCellText, { flex: 1 }]}>{prod.name}</Text>
                  <Text style={[styles.miniCellText, { width: 56, textAlign: 'center', fontWeight: '700', color: '#0f172a' }]}>
                    {prod.quantity}
                  </Text>
                </View>
              ))}
            </View>

            {/* MID — Customer details */}
            <View style={styles.expandSectionMid}>
              <Text style={styles.sectionLabel}>CUSTOMER DETAILS</Text>
              <Text style={styles.remarkText}>{item.customerName}</Text>
              <Text style={[styles.remarkText, { color: '#64748b' }]}>Mo: {item.contactNo}</Text>

              {item.remark && item.remark.trim() !== '' && (
                <View style={styles.remarkBox}>
                  <Text style={styles.remarkAlertText}>⚠ SPECIAL INSTRUCTIONS</Text>
                  <Text style={styles.remarkContentText}>{item.remark}</Text>
                </View>
              )}

              {item.assignedExecutiveName && (
                <View style={styles.assignedBadgeBox}>
                  <Text style={styles.assignedBadgeLabel}>Delivered By:</Text>
                  <Text style={styles.assignedBadgeName}>{item.assignedExecutiveName}</Text>
                </View>
              )}
            </View>

            {/* RIGHT — Billing summary */}
            <View style={styles.expandSectionRight}>
              <Text style={styles.sectionLabel}>BILLING SUMMARY</Text>
              <View style={styles.financeRow}>
                <Text style={styles.financeLabel}>Sub Total</Text>
                <Text style={styles.financeValue}>₹ {item.subTotal || 0}</Text>
              </View>
              <View style={styles.financeRow}>
                <Text style={styles.financeLabel}>Tax / GST</Text>
                <Text style={styles.financeValue}>₹ {item.tax || 0}</Text>
              </View>
              <View style={styles.financeRow}>
                <Text style={styles.financeLabel}>Delivery</Text>
                <Text style={styles.financeValue}>₹ {item.deliveryCharge || 0}</Text>
              </View>
              <View style={styles.financeDivider} />
              <View style={styles.financeRow}>
                <Text style={[styles.financeLabel, { fontWeight: '700', color: '#0f172a' }]}>TOTAL BILL</Text>
                <Text style={[styles.financeValue, { fontSize: 15, fontWeight: '800', color: '#0f172a' }]}>
                  ₹ {item.totalAmount || 0}
                </Text>
              </View>

              {isCOD && (
                <View style={styles.amountToCollectBar}>
                  <Text style={styles.atcLabel}>COLLECT CASH</Text>
                  <Text style={styles.atcValue}>₹ {amountToCollect}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function FilteredOrdersScreen({ statusFilter, title }) {
  const [orders, setOrders]               = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', '==', statusFilter));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setOrders(list);
      setFilteredOrders(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [statusFilter]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredOrders(orders); return; }
    const q = searchQuery.toLowerCase();
    setFilteredOrders(orders.filter(o =>
      (o.orderNo || '').toString().toLowerCase().includes(q) ||
      (o.vendorName || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.trainInfo || '').toLowerCase().includes(q) ||
      (o.assignedExecutiveName || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, orders]);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0f172a" />
      <Text style={styles.loadingText}>Loading orders…</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>{title}</Text>
          <View style={styles.countRow}>
            <View style={[
              styles.countDot,
              {
                backgroundColor:
                  statusFilter === 'Completed' ? '#16a34a' :
                  statusFilter === 'Cancelled' ? '#dc2626' : '#f59e0b'
              }
            ]} />
            <Text style={styles.subHeading}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order, vendor, train…"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Table container ── */}
      <View style={styles.tableContainer}>

        {/* Table header — same columns as Dashboard */}
        <View style={styles.tableHeader}>
          <View style={{ width: 36 }} />
          <Text style={[styles.col, { flex: 0.8 }]}>STATUS</Text>
          <Text style={[styles.col, { flex: 1.1 }]}>ORDER NO.</Text>
          <Text style={[styles.col, { flex: 1.0 }]}>DATE</Text>
          <Text style={[styles.col, { flex: 0.8 }]}>TIME</Text>
          <Text style={[styles.col, { flex: 1.2 }]}>VENDOR</Text>
          <Text style={[styles.col, { flex: 1.2 }]}>TRAIN</Text>
          <Text style={[styles.col, { flex: 0.9 }]}>PAYMENT</Text>
          <Text style={[styles.col, { flex: 1.2 }]}>DELIVERY EXEC</Text>
        </View>

        {/* Rows */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={36} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No orders match your search' : `No ${statusFilter.toLowerCase()} orders`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ExpandableOrderRow item={item} />}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — mirrors DashboardScreen's stylesheet 1-to-1
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  loadingText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  heading: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  countDot: { width: 7, height: 7, borderRadius: 4 },
  subHeading: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 280,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
  },

  // Table wrapper
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  col: { fontSize: 10, fontWeight: '700', color: '#ffffff', letterSpacing: 0.8 },

  // Card / row
  cardContainer: { borderBottomWidth: 1, borderColor: '#f1f5f9' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  tableRowExpanded: { backgroundColor: '#f8fafc' },
  cell: { fontSize: 13, color: '#334155', fontWeight: '700'},

  // Badges & tags
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  paymentTag: {
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
  },
  dotIndicator: { width: 8, height: 8, borderRadius: 4 },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyStateText: { fontSize: 14, color: '#94a3b8' },

  // ── Expanded content ──
  expandedContent: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  expandedLayout: { flexDirection: 'row', gap: 16 },

  // LEFT section — items
  expandSectionLeft: {
    flex: 1.5,
    backgroundColor: 'white',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniHeadText: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.6 },
  miniTableRow: {
    flexDirection: 'row',
    padding: 9,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  miniCellText: { fontSize: 13, color: '#334155' },

  // MID section — customer
  expandSectionMid: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  remarkText: { fontSize: 13, color: '#0f172a', fontWeight: '500', marginBottom: 3 },
  remarkBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  remarkAlertText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  remarkContentText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 16,
  },
  assignedBadgeBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  assignedBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  assignedBadgeName: { fontSize: 13, fontWeight: '700', color: '#14532d' },

  // RIGHT section — billing
  expandSectionRight: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  financeLabel: { fontSize: 12, color: '#64748b' },
  financeValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  financeDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  amountToCollectBar: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  atcLabel: { color: '#94a3b8', fontWeight: '700', fontSize: 10, letterSpacing: 0.8 },
  atcValue: { color: 'white', fontWeight: '800', fontSize: 15 },
});
