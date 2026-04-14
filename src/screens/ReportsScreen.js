import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, ActivityIndicator
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const screenWidth = Dimensions.get('window').width;

const StatusBadge = ({ status }) => {
  const isCancelled = status === 'Cancelled';
  return (
    <View style={[
      styles.badge,
      { backgroundColor: isCancelled ? '#fef2f2' : '#f0fdf4', borderColor: isCancelled ? '#fecaca' : '#bbf7d0' }
    ]}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: isCancelled ? '#dc2626' : '#16a34a', letterSpacing: 0.5 }}>
        {status}
      </Text>
    </View>
  );
};

const ReportRow = ({ item, isEven }) => (
  <View style={[styles.tableRow, isEven && styles.tableRowAlt]}>
    <Text style={[styles.cell, { flex: 1, fontWeight: '600', color: '#0f172a' }]}>{item.orderNo}</Text>
    <Text style={[styles.cell, { flex: 1 }]}>{item.orderDate}</Text>
    <Text style={[styles.cell, { flex: 1 }]}>{item.orderTime}</Text>
    <Text style={[styles.cell, { flex: 1.5 }]}>{item.vendorName}</Text>
    <Text style={[styles.cell, { flex: 1, fontWeight: '700', color: '#0f172a' }]}>₹{item.totalAmount}</Text>
    <View style={{ flex: 0.9, alignItems: 'flex-start' }}>
      <StatusBadge status={item.status} />
    </View>
  </View>
);

export default function ReportsScreen() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterType, setFilterType] = useState('Today');
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(data);
      applyFilter(data, filterType);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const applyFilter = (data, type) => {
    const now = new Date();
    let result = [];
    const clearTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = clearTime(now);

    if (type === 'Today') {
      result = data.filter(o => {
        const d = new Date(o.orderDate);
        return clearTime(d).getTime() === today.getTime();
      });
    } else if (type === 'Week') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      result = data.filter(o => new Date(o.orderDate) >= lastWeek);
    } else if (type === 'Month') {
      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);
      result = data.filter(o => new Date(o.orderDate) >= lastMonth);
    } else if (type === 'Custom') {
      result = data.filter(o => {
        const d = new Date(o.orderDate);
        return d >= startDate && d <= endDate;
      });
    }
    setFilteredOrders(result);
    setFilterType(type);
  };

  const getPieData = () => {
    const counts = {};
    filteredOrders.forEach(o => {
      const v = o.vendorName || 'Unknown';
      counts[v] = (counts[v] || 0) + 1;
    });
    const colors = ['#0f172a', '#475569', '#94a3b8', '#cbd5e1', '#334155', '#64748b'];
    return Object.keys(counts).map((key, i) => ({
      name: key,
      population: counts[key],
      color: colors[i % colors.length],
      legendFontColor: '#64748b',
      legendFontSize: 11
    }));
  };

  const downloadExcel = async () => {
    let csv = 'Order No,Date,Time,Vendor,Subtotal,Tax,Total,Status\n';
    filteredOrders.forEach(o => {
      csv += `${o.orderNo},${o.orderDate},${o.orderTime},"${o.vendorName}",${o.subTotal},${o.tax},${o.totalAmount},${o.status}\n`;
    });

    const filename = `Reports_${filterType}.csv`;
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    } else {
      const uri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, csv);
      await Sharing.shareAsync(uri);
    }
  };

  // Summary stats
  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const completedCount = filteredOrders.filter(o => o.status !== 'Cancelled').length;
  const cancelledCount = filteredOrders.filter(o => o.status === 'Cancelled').length;

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color="#0f172a" />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* HEADER */}
      <View style={styles.pageHeader}>
        <Text style={styles.heading}>Sales Reports</Text>
        <Text style={styles.headingSub}>Live sales data overview</Text>
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filterRow}>
        {['Today', 'Week', 'Month', 'Custom'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.filterBtn, filterType === t && styles.activeBtn]}
            onPress={() => applyFilter(orders, t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filterType === t && styles.activeFilterText]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CUSTOM DATE PICKER */}
      {filterType === 'Custom' && (
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => setShowStart(true)} style={styles.dateBtn}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.dateBtnText}>From: {startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEnd(true)} style={styles.dateBtn}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.dateBtnText}>To: {endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => applyFilter(orders, 'Custom')} style={styles.goBtn}>
            <Text style={styles.goBtnText}>Apply</Text>
          </TouchableOpacity>

          {(showStart || showEnd) && (
            <DateTimePicker
              value={showStart ? startDate : endDate}
              mode="date"
              onChange={(e, d) => {
                if (showStart) { setStartDate(d || startDate); setShowStart(false); }
                else { setEndDate(d || endDate); setShowEnd(false); }
              }}
            />
          )}
        </View>
      )}

      {/* SUMMARY STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL ORDERS</Text>
          <Text style={styles.statValue}>{filteredOrders.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>REVENUE</Text>
          <Text style={styles.statValue}>₹{totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>COMPLETED</Text>
          <Text style={[styles.statValue, { color: '#16a34a' }]}>{completedCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CANCELLED</Text>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{cancelledCount}</Text>
        </View>
      </View>

      {/* CHART */}
      <View style={styles.chartCard}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleDot} />
          <Text style={styles.sectionTitle}>Vendor Share</Text>
        </View>
        {filteredOrders.length > 0 ? (
          <PieChart
            data={getPieData()}
            width={screenWidth - 80}
            height={200}
            chartConfig={{ color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})` }}
            accessor={'population'}
            backgroundColor={'transparent'}
            paddingLeft={'15'}
            absolute
          />
        ) : (
          <View style={styles.chartEmpty}>
            <Ionicons name="pie-chart-outline" size={28} color="#cbd5e1" />
            <Text style={styles.chartEmptyText}>No data for selected period</Text>
          </View>
        )}
      </View>

      {/* EXPORT BUTTON */}
      <TouchableOpacity style={styles.exportBtn} onPress={downloadExcel} activeOpacity={0.85}>
        <Ionicons name="download-outline" size={16} color="white" />
        <Text style={styles.exportBtnText}>Export as CSV</Text>
      </TouchableOpacity>

      {/* TABLE */}
      <View style={styles.tableCard}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleDot} />
          <Text style={styles.sectionTitle}>Order Ledger</Text>
          <Text style={styles.tableCount}>{filteredOrders.length} records</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.headCol, { flex: 1 }]}>ORDER ID</Text>
          <Text style={[styles.headCol, { flex: 1 }]}>DATE</Text>
          <Text style={[styles.headCol, { flex: 1 }]}>TIME</Text>
          <Text style={[styles.headCol, { flex: 1.5 }]}>VENDOR</Text>
          <Text style={[styles.headCol, { flex: 1 }]}>AMOUNT</Text>
          <Text style={[styles.headCol, { flex: 0.9 }]}>STATUS</Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.tableEmpty}>
            <Ionicons name="receipt-outline" size={28} color="#cbd5e1" />
            <Text style={styles.chartEmptyText}>No orders found</Text>
          </View>
        ) : (
          filteredOrders.map((item, index) => (
            <ReportRow key={item.id} item={item} isEven={index % 2 === 0} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },

  pageHeader: { marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headingSub: { fontSize: 13, color: '#94a3b8', marginTop: 3, fontWeight: '500' },

  // Filters
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeBtn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  filterText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  activeFilterText: { color: 'white' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateBtnText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  goBtn: { backgroundColor: '#0f172a', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  goBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },

  // Section header
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitleDot: { width: 3, height: 14, backgroundColor: '#0f172a', borderRadius: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  tableCount: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginLeft: 4 },

  // Chart
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  chartEmpty: { paddingVertical: 32, alignItems: 'center', gap: 10 },
  chartEmptyText: { fontSize: 13, color: '#94a3b8' },

  // Export
  exportBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0f172a',
    padding: 13,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportBtnText: { color: 'white', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },

  // Table
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 2,
  },
  headCol: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  cell: { fontSize: 12, color: '#475569' },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tableEmpty: { paddingVertical: 32, alignItems: 'center', gap: 10 },
});
