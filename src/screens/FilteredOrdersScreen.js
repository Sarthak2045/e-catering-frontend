import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Dimensions, ActivityIndicator, TextInput,
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const PIE_COLORS = [
  '#2563eb', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#8b5cf6', '#f97316', '#64748b',
  '#ec4899', '#14b8a6', '#eab308', '#a855f7',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `₹ ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const clearTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const fmtDate = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const COD_TYPES = ['COD', 'CASH', 'CASH_ON_DELIVERY'];
const normPayment = (p) =>
  COD_TYPES.includes((p || '').toUpperCase().replace(/\s+/g, '_')) ? 'COD' : 'ONLINE';

const parseDate = (str) => {
  if (!str) return new Date(0);
  const p = str.split('-');
  if (p.length === 3 && p[0].length === 4)
    return new Date(+p[0], +p[1] - 1, +p[2]);
  if (p.length === 3 && p[2].length === 4)
    return new Date(+p[2], +p[1] - 1, +p[0]);
  return new Date(str);
};

// ─── Smart Pie Chart ─────────────────────────────────────────────────────────
function CustomPieChart({ data, size, title }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.population, 0);
  const maxLabelChars = Math.max(...data.map(d => d.name.length));
  const labelPadding  = Math.max(maxLabelChars * 6.5, 60);
  const svgWidth  = size + (labelPadding * 2) + 40;
  const svgHeight = size + 40;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const r  = size * 0.26;

  if (data.length === 1) {
    return (
      <View style={{ alignItems: 'center' }}>
        {title && <Text style={styles.pieTitle}>{title}</Text>}
        <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <Circle cx={cx} cy={cy} r={r} fill={data[0].color} />
          <Line x1={cx} y1={cy + r} x2={cx} y2={cy + r + 25} stroke={data[0].color} strokeWidth="1.5" />
          <Circle cx={cx} cy={cy + r} r="2.5" fill={data[0].color} />
          <SvgText x={cx} y={cy + r + 40} fontSize="14" fontWeight="700" fill="#1e293b" textAnchor="middle">
             {data[0].name} ({data[0].population})
          </SvgText>
        </Svg>
      </View>
    );
  }

  const rawSlices = [];
  let startAngle = -Math.PI / 2;

  data.forEach((item) => {
    const angle    = (item.population / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const midAngle = startAngle + angle / 2;
    const ax = cx + (r + 4)  * Math.cos(midAngle);
    const ay = cy + (r + 4)  * Math.sin(midAngle);
    const bx = cx + (r + 22) * Math.cos(midAngle);
    const by = cy + (r + 22) * Math.sin(midAngle);

    rawSlices.push({
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: item.color,
      midAngle, ax, ay, bx, by,
      name: item.name,
      count: item.population,
      percent: ((item.population / total) * 100).toFixed(1),
      isRight: Math.cos(midAngle) >= 0,
    });
    startAngle = endAngle;
  });

  const LABEL_HEIGHT = 32;
  const distributeLabels = (slices, side) => {
    const out = [];
    slices.forEach((s, i) => {
      let ly = s.by;
      if (i > 0) { const prevY = out[i - 1].ly; if (ly - prevY < LABEL_HEIGHT) ly = prevY + LABEL_HEIGHT; }
      const lx = side === 'right' ? cx + r + 35 : cx - r - 35;
      out.push({ ...s, lx, ly, side });
    });
    return out;
  };

  const finalRight = distributeLabels(rawSlices.filter(s =>  s.isRight).sort((a, b) => a.by - b.by), 'right');
  const finalLeft  = distributeLabels(rawSlices.filter(s => !s.isRight).sort((a, b) => a.by - b.by), 'left');
  const allLabeled = [...finalRight, ...finalLeft];

  return (
    <View style={{ alignItems: 'center' }}>
      {title && <Text style={styles.pieTitle}>{title}</Text>}
      <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {rawSlices.map((s, i) => (
          <Path key={`slice-${i}`} d={s.path} fill={s.color} stroke="white" strokeWidth="1" />
        ))}
        {allLabeled.map((s, i) => {
          const textAnchor = s.side === 'right' ? 'start' : 'end';
          const textX      = s.side === 'right' ? s.lx + 4 : s.lx - 4;
          return (
            <G key={`lbl-${i}`}>
              <Line x1={s.ax} y1={s.ay} x2={s.bx} y2={s.by} stroke={s.color} strokeWidth="1.3" />
              <Line x1={s.bx} y1={s.by} x2={s.lx} y2={s.ly} stroke={s.color} strokeWidth="1.3" />
              <Circle cx={s.ax} cy={s.ay} r="2" fill={s.color} />
              <Circle cx={s.lx} cy={s.ly} r="2" fill={s.color} />
              <SvgText x={textX} y={s.ly - 2}  fontSize="13" fontWeight="700" fill="#1e293b" textAnchor={textAnchor}>{s.name}</SvgText>
              <SvgText x={textX} y={s.ly + 13} fontSize="11" fontWeight="500" fill="#64748b" textAnchor={textAnchor}>{s.count} ({s.percent}%)</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Summary Card ────────────────────────────────────────────────────────────
const SummaryCard = ({ title, subtitle, color = '#16a34a' }) => (
  <View style={[styles.summaryCard, { backgroundColor: color, shadowColor: color }]}>
    <Text style={styles.summaryTitle}>{title}</Text>
    <Text style={styles.summarySubtitle}>{subtitle}</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [orders, setOrders]           = useState([]);
  const [filteredOrders, setFiltered] = useState([]);
  const [filterType, setFilterType]   = useState('Today');
  const [loading, setLoading]         = useState(true);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate]     = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd]     = useState(false);

  const [showPeriodDrop, setShowPeriodDrop] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [paymentMode]                       = useState('All');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [search, setSearch]                 = useState('');

  const PERIOD_OPTIONS = ['Today', 'Week', 'Month', 'Custom'];
  const STATUS_OPTIONS = ['All', 'Completed', 'Cancelled'];

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => parseDate(b.deliveryDate) - parseDate(a.deliveryDate));
      setOrders(data);
      applyFilter(data, 'Today', new Date(), new Date());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const applyFilter = (data, type, sd, ed) => {
    const today = clearTime(new Date());
    let result  = [];
    if (type === 'Today') {
      result = data.filter(o =>
        clearTime(parseDate(o.deliveryDate)).getTime() === today.getTime()
      );
    } else if (type === 'Week') {
      const from = new Date(today); from.setDate(today.getDate() - 7);
      result = data.filter(o => parseDate(o.deliveryDate) >= from);
    } else if (type === 'Month') {
      const from = new Date(today); from.setDate(today.getDate() - 30);
      result = data.filter(o => parseDate(o.deliveryDate) >= from);
    } else if (type === 'Custom') {
      const from = clearTime(sd);
      const to   = new Date(clearTime(ed)); to.setDate(to.getDate() + 1);
      result = data.filter(o => {
        const d = parseDate(o.deliveryDate);
        return d >= from && d < to;
      });
    }
    setFiltered(result);
    setFilterType(type);
  };

  const handlePeriodSelect = (type) => {
    setShowPeriodDrop(false);
    if (type !== 'Custom') applyFilter(orders, type, startDate, endDate);
    else setFilterType('Custom');
  };

  const displayOrders = filteredOrders.filter(o => {
    const q = search.toLowerCase();
    const matchMode = paymentMode === 'All' || normPayment(o.paymentType) === paymentMode;

    let matchStatus = false;
    if (statusFilter === 'All')       matchStatus = o.status === 'Completed' || o.status === 'Cancelled';
    if (statusFilter === 'Completed') matchStatus = o.status === 'Completed';
    if (statusFilter === 'Cancelled') matchStatus = o.status === 'Cancelled';

    const matchSearch = !q ||
      (o.vendorName || '').toLowerCase().includes(q) ||
      (o.orderNo    || '').toLowerCase().includes(q);

    return matchMode && matchStatus && matchSearch;
  });

  const vendorSummary = (() => {
    const map = {};
    displayOrders.forEach(o => {
      const v = o.vendorName || 'Unknown';
      if (!map[v]) map[v] = {
        vendorName: v,
        delivered: 0, cancelled: 0,
        total: 0, cod: 0, codCount: 0,
        online: 0, onlineCount: 0, totalCount: 0,
      };

      if (o.status === 'Cancelled') { map[v].cancelled++; return; }

      map[v].delivered++;
      const pm  = normPayment(o.paymentType);
      const amt = o.totalAmount || 0;
      map[v].total      += amt;
      map[v].totalCount++;
      if (pm === 'COD')    { map[v].cod    += amt; map[v].codCount++;    }
      if (pm === 'ONLINE') { map[v].online += amt; map[v].onlineCount++; }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  })();

  const completedOrders = displayOrders.filter(o => o.status === 'Completed');

  const totalRevenue  = completedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const codRevenue    = completedOrders.filter(o => normPayment(o.paymentType) === 'COD').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const onlineRevenue = completedOrders.filter(o => normPayment(o.paymentType) === 'ONLINE').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const codCount      = completedOrders.filter(o => normPayment(o.paymentType) === 'COD').length;
  const onlineCount   = completedOrders.filter(o => normPayment(o.paymentType) === 'ONLINE').length;

  const statusPieData = (() => {
    const delivered = displayOrders.filter(o => o.status === 'Completed').length;
    const cancelled = displayOrders.filter(o => o.status === 'Cancelled').length;
    const out = [];
    if (delivered > 0) out.push({ name: 'Delivered', population: delivered, color: '#22c55e' });
    if (cancelled > 0) out.push({ name: 'Cancelled', population: cancelled, color: '#ef4444' });
    return out;
  })();

  const vendorPieData = (() => {
    const counts = {};
    completedOrders.forEach(o => {
      const v = o.vendorName || 'Unknown';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.keys(counts)
      .map((key, i) => ({ name: key, population: counts[key], color: PIE_COLORS[i % PIE_COLORS.length] }))
      .sort((a, b) => b.population - a.population);
  })();

  const exportCSV = async (vendorFilter = null) => {
    const rows = vendorFilter
      ? displayOrders.filter(o => o.vendorName === vendorFilter)
      : displayOrders;
    let csv = 'Order No,Date,Time,Vendor,Subtotal,Tax,Total,Payment Type,Status\n';
    rows.forEach(o => {
      csv += `${o.orderNo},${o.deliveryDate},${o.orderTime},"${o.vendorName}",${o.subTotal},${o.tax},${o.totalAmount},${normPayment(o.paymentType)},${o.status}\n`;
    });
    const filename = vendorFilter
      ? `Report_${vendorFilter.replace(/\s+/g, '_')}_${filterType}.csv`
      : `Reports_${filterType}.csv`;
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
    } else {
      const uri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, csv);
      await Sharing.shareAsync(uri);
    }
  };

  const sw     = Dimensions.get('window').width;
  const PIE_SZ = Math.min(Math.floor((sw - 100) / 3.5), 240);

  const toISOLocal = (d) => {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#eef2f7' }}>

      {/* ── TOP CONTROLS ── */}
      <View style={styles.controlsBar}>
        <View style={styles.topRow}>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={14} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendor / order…"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Period dropdown */}
          <View style={styles.dropWrap}>
            <TouchableOpacity
              style={styles.dropBtn}
              onPress={() => { setShowPeriodDrop(p => !p); setShowStatusDrop(false); }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropBtnText}>{filterType}</Text>
              <Ionicons name="chevron-down" size={12} color="#334155" />
            </TouchableOpacity>
            {showPeriodDrop && (
              <View style={styles.dropMenu}>
                {PERIOD_OPTIONS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.dropMenuItem, filterType === p && styles.dropMenuItemActive]}
                    onPress={() => handlePeriodSelect(p)}
                  >
                    <Text style={[styles.dropMenuText, filterType === p && styles.dropMenuTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Status dropdown */}
          <View style={styles.dropWrap}>
            <TouchableOpacity
              style={styles.dropBtn}
              onPress={() => { setShowStatusDrop(s => !s); setShowPeriodDrop(false); }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropBtnText}>{statusFilter}</Text>
              <Ionicons name="chevron-down" size={12} color="#334155" />
            </TouchableOpacity>
            {showStatusDrop && (
              <View style={styles.dropMenu}>
                {STATUS_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.dropMenuItem, statusFilter === s && styles.dropMenuItemActive]}
                    onPress={() => { setStatusFilter(s); setShowStatusDrop(false); }}
                  >
                    <Text style={[styles.dropMenuText, statusFilter === s && styles.dropMenuTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* ── Custom date pickers — always visible, right before Export ── */}
          <View style={styles.dateBtn}>
            <Ionicons name="calendar-outline" size={13} color="#2563eb" />
            <Text style={styles.dateBtnText}>From: </Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={toISOLocal(startDate)}
                onChange={e => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    setStartDate(new Date(y, m - 1, d));
                  }
                }}
                style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1d4ed8', fontWeight: '600', backgroundColor: 'transparent', cursor: 'pointer' }}
              />
            ) : (
              <>
                <TouchableOpacity onPress={() => { setShowStart(true); setShowEnd(false); }}>
                  <Text style={styles.dateBtnText}>{fmtDate(startDate)}</Text>
                </TouchableOpacity>
                {showStart && (
                  <DateTimePicker value={startDate} mode="date"
                    onChange={(_, d) => { if (d) setStartDate(d); setShowStart(false); }} />
                )}
              </>
            )}
          </View>

          <Text style={styles.dateArrow}>→</Text>

          <View style={styles.dateBtn}>
            <Ionicons name="calendar-outline" size={13} color="#2563eb" />
            <Text style={styles.dateBtnText}>To: </Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={toISOLocal(endDate)}
                onChange={e => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    setEndDate(new Date(y, m - 1, d));
                  }
                }}
                style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1d4ed8', fontWeight: '600', backgroundColor: 'transparent', cursor: 'pointer' }}
              />
            ) : (
              <>
                <TouchableOpacity onPress={() => { setShowEnd(true); setShowStart(false); }}>
                  <Text style={styles.dateBtnText}>{fmtDate(endDate)}</Text>
                </TouchableOpacity>
                {showEnd && (
                  <DateTimePicker value={endDate} mode="date"
                    onChange={(_, d) => { if (d) setEndDate(d); setShowEnd(false); }} />
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => applyFilter(orders, 'Custom', startDate, endDate)}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>

          {/* Export */}
          <TouchableOpacity style={styles.exportBtn} onPress={() => exportCSV()} activeOpacity={0.85}>
            <Text style={styles.exportBtnText}>EXPORT</Text>
          </TouchableOpacity>

        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── CHART CARD ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            <View style={styles.piesSection}>
              <View style={styles.pieBlock}>
                {statusPieData.length > 0 ? (
                  <CustomPieChart data={statusPieData} size={PIE_SZ} title="Order Status" />
                ) : (
                  <View style={[styles.emptyPie, { width: PIE_SZ, height: PIE_SZ }]}>
                    <Ionicons name="pie-chart-outline" size={40} color="#cbd5e1" />
                    <Text style={styles.emptyTxt}>No data</Text>
                  </View>
                )}
              </View>
              <View style={styles.pieBlock}>
                {vendorPieData.length > 0 ? (
                  <CustomPieChart data={vendorPieData} size={PIE_SZ} title="Vendor Share" />
                ) : (
                  <View style={[styles.emptyPie, { width: PIE_SZ, height: PIE_SZ }]}>
                    <Ionicons name="pie-chart-outline" size={40} color="#cbd5e1" />
                    <Text style={styles.emptyTxt}>No data</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.summaryColumn}>
              <SummaryCard
                title={`Total : ${fmt(totalRevenue)}`}
                subtitle={`Orders : ${completedOrders.length}`}
                color="#16a34a"
              />
              <SummaryCard
                title={`COD : ${fmt(codRevenue)}`}
                subtitle={`Orders : ${codCount}`}
                color="#0891b2"
              />
              <SummaryCard
                title={`Online : ${fmt(onlineRevenue)}`}
                subtitle={`Orders : ${onlineCount}`}
                color="#7c3aed"
              />
            </View>
          </View>
        </View>

        {/* ── VENDOR TABLE ── */}
        <View style={styles.tableCard}>
          <View style={styles.tableHead}>
            {[
              { label: 'No',        f: 0.4 },
              { label: 'Vendor',    f: 1.8 },
              { label: 'Delivered', f: 0.8 },
              { label: 'Cancelled', f: 0.8 },
              { label: 'Total',     f: 1.4 },
              { label: 'COD',       f: 1.4 },
              { label: 'Online',    f: 1.4 },
              { label: 'Actions',   f: 0.6 },
            ].map(({ label, f }) => (
              <Text key={label} style={[styles.th, { flex: f }]}>{label}</Text>
            ))}
          </View>

          {vendorSummary.length === 0 ? (
            <View style={styles.tableEmpty}>
              <Ionicons name="receipt-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTxt}>No orders found</Text>
            </View>
          ) : (
            vendorSummary.map((v, i) => (
              <View key={v.vendorName} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.td, { flex: 0.4, color: '#94a3b8' }]}>{i + 1}</Text>
                <Text style={[styles.td, { flex: 1.8, fontWeight: '600', color: '#1e293b' }]}>{v.vendorName}</Text>
                <Text style={[styles.td, { flex: 0.8, color: '#16a34a', fontWeight: '700' }]}>{v.delivered}</Text>
                <Text style={[styles.td, { flex: 0.8, color: v.cancelled > 0 ? '#dc2626' : '#94a3b8', fontWeight: '700' }]}>{v.cancelled}</Text>

                <View style={{ flex: 1.4 }}>
                  <Text style={styles.tdAmt}>{fmt(v.total)}</Text>
                  <Text style={styles.tdCnt}>({v.totalCount} orders)</Text>
                </View>

                <View style={{ flex: 1.4 }}>
                  <Text style={[styles.tdAmt, { color: '#0891b2' }]}>{fmt(v.cod)}</Text>
                  <Text style={styles.tdCnt}>({v.codCount} orders)</Text>
                </View>

                <View style={{ flex: 1.4 }}>
                  <Text style={[styles.tdAmt, { color: '#7c3aed' }]}>{fmt(v.online)}</Text>
                  <Text style={styles.tdCnt}>({v.onlineCount} orders)</Text>
                </View>

                <View style={{ flex: 0.6, alignItems: 'center' }}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => exportCSV(v.vendorName)} activeOpacity={0.8}>
                    <Ionicons name="arrow-redo" size={13} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {(showPeriodDrop || showStatusDrop) && (
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() => { setShowPeriodDrop(false); setShowStatusDrop(false); }}
          activeOpacity={1}
          pointerEvents="box-only"
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2f7' },

  controlsBar: { backgroundColor: '#eef2f7', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4, zIndex: 100 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },

  searchBox: {
    flex: 0.7, minWidth: 110, maxWidth: 260,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'white', borderRadius: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    paddingVertical: 9, paddingHorizontal: 11,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1e293b', padding: 0, margin: 0, outlineStyle: 'none' },

  dropWrap: { zIndex: 200 },
  dropBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'white', borderRadius: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    paddingVertical: 9, paddingHorizontal: 13,
  },
  dropBtnText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  dropMenu: {
    position: 'absolute', top: 42, left: 0,
    backgroundColor: 'white', borderRadius: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.12,
    shadowRadius: 12, elevation: 20, minWidth: 120, zIndex: 9999,
  },
  dropMenuItem: { paddingVertical: 11, paddingHorizontal: 16 },
  dropMenuItemActive: { backgroundColor: '#eff6ff' },
  dropMenuText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  dropMenuTextActive: { color: '#2563eb', fontWeight: '700' },

  exportBtn: { backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  exportBtnText: { color: 'white', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff',
    paddingVertical: 7, paddingHorizontal: 10, borderRadius: 6,
  },
  dateBtnText:  { fontSize: 12, color: '#1d4ed8', fontWeight: '600' },
  dateArrow:    { color: '#94a3b8', fontWeight: '700', fontSize: 16 },
  applyBtn:     { backgroundColor: '#2563eb', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 6 },
  applyBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },

  scroll: { flex: 1 },

  chartCard: {
    backgroundColor: 'white', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  chartRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
  },
  piesSection: {
    flex: 2.5, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-around',
    minWidth: 500, gap: 10,
  },
  pieBlock:        { alignItems: 'center', justifyContent: 'center' },
  pieTitle:        { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, letterSpacing: 0.3 },
  emptyPie:        { alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTxt:        { fontSize: 12, color: '#94a3b8' },

  summaryColumn:   { flex: 0.8, flexDirection: 'column', gap: 8, minWidth: 180, maxWidth: 220 },
  summaryCard:     { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  summaryTitle:    { fontSize: 12, fontWeight: '700', color: 'white', marginBottom: 2 },
  summarySubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  tableCard: {
    backgroundColor: 'white', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  tableHead: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 12, paddingHorizontal: 10 },
  th: { fontSize: 10, fontWeight: '700', color: 'white', letterSpacing: 0.3, textAlign: 'left' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10,
    borderBottomWidth: 1, borderColor: '#f1f5f9', alignItems: 'center',
  },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  td:          { fontSize: 12, color: '#475569' },
  tdAmt:       { fontSize: 11.5, color: '#1e293b', fontWeight: '700' },
  tdCnt:       { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  tableEmpty:  { paddingVertical: 44, alignItems: 'center', gap: 10 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
  },
});
