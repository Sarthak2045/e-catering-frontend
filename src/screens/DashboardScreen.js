import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  SafeAreaView, Modal, Platform, Alert, TextInput, Dimensions, ScrollView
} from 'react-native';
import { collection, onSnapshot, query, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import alertSoundFile from '../../assets/alert.mp3';
import { db } from '../firebaseConfig';

const screenWidth = Dimensions.get('window').width;

let isShiftStarted = false; 

const ExpandableOrderRow = ({ item, onPrint, onEditStatus, onAssign }) => {
  const [expanded, setExpanded] = useState(false);

  const isCancelled = item.status === 'Cancelled';
  const isCompleted = item.status === 'Completed';
  const badgeBg = isCancelled ? '#fef2f2' : (isCompleted ? '#f0fdf4' : '#fffbeb');
  const badgeTxt = isCancelled ? '#dc2626' : (isCompleted ? '#16a34a' : '#b45309');
  const badgeBorder = isCancelled ? '#fecaca' : (isCompleted ? '#bbf7d0' : '#fde68a');

  const isCOD = item.paymentType === 'COD';
  const paymentColor = isCOD ? '#b45309' : '#0f766e';
  const amountToCollect = isCOD ? (item.totalAmount || 0) : 0;

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={[styles.tableRow, expanded && styles.tableRowExpanded]} onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
        <View style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#94a3b8" />
        </View>

        <View style={{ flex: 0.8 }}>
          <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: badgeTxt, letterSpacing: 0.5 }}>{item.status || 'ACTIVE'}</Text>
          </View>
        </View>

        <Text style={[styles.cell, { flex: 1.1, fontWeight: '700', color: '#0f172a' }]}>{item.orderNo}</Text>
        <Text style={[styles.cell, { flex: 1.0, fontSize: 12 }]}>{item.orderDate || '—'}</Text>
        <Text style={[styles.cell, { flex: 0.8, fontSize: 12, fontWeight: '500' }]}>{item.orderTime || '—'}</Text>
        <Text style={[styles.cell, { flex: 1.2 }]} numberOfLines={1}>{item.vendorName}</Text>
        
        <Text style={[styles.cell, { flex: 1.2 }]} numberOfLines={2}>
          {item.trainInfo || 'N/A'}{' '}
          <Text style={{ color: '#dc2626', fontWeight: '700' }}>({item.coach || 'No Coach'}{item.seat ? ` / ${item.seat}` : ''})</Text>
        </Text>

        <View style={{ flex: 0.9 }}>
          <Text style={[styles.paymentTag, { color: paymentColor, borderColor: paymentColor }]}>{item.paymentType || 'ONLINE'}</Text>
        </View>
        
        <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onAssign(item)}>
            <Ionicons name="bicycle-outline" size={16} color={item.assignedExecutiveName ? "#16a34a" : "#475569"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onEditStatus(item)}>
            <Ionicons name="create-outline" size={16} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onPrint(item)}>
            <Ionicons name="print-outline" size={16} color="#475569" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedLayout}>
            <View style={styles.expandSectionLeft}>
              <View style={styles.miniTableHeader}>
                <Text style={[styles.miniHeadText, { flex: 1 }]}>ITEM NAME</Text>
                <Text style={[styles.miniHeadText, { width: 56, textAlign: 'center' }]}>QTY</Text>
              </View>
              {item.items && item.items.map((prod, idx) => (
                <View key={idx} style={styles.miniTableRow}>
                  <Text style={[styles.miniCellText, { flex: 1 }]}>{prod.name}</Text>
                  <Text style={[styles.miniCellText, { width: 56, textAlign: 'center', fontWeight: '700', color: '#0f172a' }]}>{prod.quantity}</Text>
                </View>
              ))}
            </View>

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
                   <Text style={styles.assignedBadgeLabel}>ASSIGNED TO:</Text>
                   <Text style={styles.assignedBadgeName}>{item.assignedExecutiveName}</Text>
                </View>
              )}
            </View>

            <View style={styles.expandSectionRight}>
              <Text style={styles.sectionLabel}>BILLING SUMMARY</Text>
              <View style={styles.financeRow}><Text style={styles.financeLabel}>Sub Total</Text><Text style={styles.financeValue}>₹ {item.subTotal || 0}</Text></View>
              <View style={styles.financeRow}><Text style={styles.financeLabel}>Tax / GST</Text><Text style={styles.financeValue}>₹ {item.tax || 0}</Text></View>
              <View style={styles.financeRow}><Text style={styles.financeLabel}>Delivery</Text><Text style={styles.financeValue}>₹ {item.deliveryCharge || 0}</Text></View>
              <View style={styles.financeDivider} />
              <View style={styles.financeRow}>
                <Text style={[styles.financeLabel, { fontWeight: '700', color: '#0f172a' }]}>TOTAL BILL</Text>
                <Text style={[styles.financeValue, { fontSize: 15, fontWeight: '800', color: '#0f172a' }]}>₹ {item.totalAmount || 0}</Text>
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

export default function DashboardScreen() {
  const [appReady, setAppReady] = useState(isShiftStarted);
  const [orders, setOrders] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const soundRef = useRef(null);
  const isFirstLoad = useRef(true);

  async function initSoundSystem() {
    try {
      if (Platform.OS === 'web') {
        const audio = new window.Audio(alertSoundFile);
        await audio.play().then(() => audio.pause()).catch(e => {});
        soundRef.current = audio;
      } else {
        const { sound } = await Audio.Sound.createAsync(alertSoundFile);
        soundRef.current = sound;
      }
      isShiftStarted = true; setAppReady(true);
    } catch (error) { isShiftStarted = true; setAppReady(true); }
  }

  async function playAlert() {
    if (Platform.OS === 'web' && soundRef.current) {
      soundRef.current.currentTime = 0; soundRef.current.play().catch(e => {});
    } else if (soundRef.current) { await soundRef.current.replayAsync(); }
  }

  useEffect(() => {
    if (!appReady) return;
    const q = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setOrders(ordersList);

      let active = 0; ordersList.forEach(o => { if (o.status === 'Active') active++; });
      setActiveCount(active); setLoading(false);

      if (isFirstLoad.current) { isFirstLoad.current = false; return; }
      snapshot.docChanges().forEach((change) => { if (change.type === 'added') playAlert(); });
    }, (error) => { Alert.alert('Sync Error', error.message); });

    const unsubscribeExecs = onSnapshot(collection(db, 'executives'), (snapshot) => {
      setExecutives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubscribeOrders(); unsubscribeExecs(); };
  }, [appReady]);

  const handleMassDelete = async () => {
    if (Platform.OS === 'web') { if (!window.confirm('⚠️ Delete ALL orders?')) return; }
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      setSettingsVisible(false);
    } catch (error) { Alert.alert('Error', 'Delete failed.'); }
    setLoading(false);
  };

  // 🟢 PURE JAVASCRIPT WEB PRINTING (NO PLUGINS REQUIRED)
  const handlePrint = async (order) => {
    try {
      let itemsHtml = "";
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="width: 70%;">${item.name}</span>
              <span style="width: 30%; text-align: right;">${item.quantity}</span>
            </div>`;
        });
      }

      const amountToCollect = (order.paymentType || '').toUpperCase() === 'COD' ? order.totalAmount : 0;
      const remarksHtml = order.remark && order.remark.trim() !== '' 
        ? `<div style="margin-top: 5px; font-weight: bold;">Remarks: <br/>${order.remark}</div>` 
        : '';

      const htmlContent = `
        <html>
          <head>
            <title>Receipt</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              @page { margin: 0; size: 58mm auto; }
              body { font-family: monospace; width: 58mm; margin: 0; padding: 10px; font-size: 12px; color: black; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
              .divider { border-bottom: 1px dashed black; margin: 8px 0; }
              .lg-text { font-size: 16px; }
            </style>
          </head>
          <body>
            <div class="center bold lg-text">E-Catering Orders</div>
            <div class="center" style="margin-top: 4px;">Samrat Catering, Railway Station</div>
            <div class="center">Phone : 9876543210</div>
            
            <div class="divider"></div>
            
            <div class="row"><span>Order No.</span><span>${order.orderNo || order.pnr || "N/A"}</span></div>
            <div class="row"><span>Vendor</span><span>${(order.vendorName || "Samrat").substring(0, 15)}</span></div>
            <div class="row"><span>Date</span><span>${order.orderDate || new Date().toLocaleDateString('en-GB')}</span></div>
            <div class="row"><span>Time</span><span>${order.orderTime || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="row"><span>Customer</span><span>${(order.customerName || "Customer").substring(0, 15)}</span></div>
            <div class="row"><span>Mobile</span><span>${order.contactNo || "N/A"}</span></div>
            
            <div class="divider"></div>
            
            <div class="row bold"><span>Item</span><span>Qty</span></div>
            <div class="divider" style="margin-top: 2px;"></div>
            ${itemsHtml}
            
            <div class="divider"></div>
            
            ${remarksHtml}
            <div class="row"><span>Advance:</span><span>Rs 0</span></div>
            <div class="row"><span>GST:</span><span>Rs ${order.tax || 0}</span></div>
            <div class="row"><span>Delivery:</span><span>Rs ${order.deliveryCharge || 0}</span></div>
            <div class="row"><span>Discount:</span><span>Rs 0</span></div>
            <div class="row bold"><span>Total:</span><span>Rs ${order.totalAmount || 0}</span></div>
            <div class="row bold"><span>To Collect:</span><span>Rs ${amountToCollect || 0}</span></div>
            
            <div class="divider"></div>
            <div class="center bold lg-text" style="font-size: 18px;">${(order.paymentType || 'ONLINE').toUpperCase()}</div>
            <div class="divider"></div>
            <div class="center bold lg-text">${(order.trainInfo || "Train").substring(0, 10)} | ${order.coach || "-"}/${order.seat || "-"}</div>
            <div class="divider"></div>
            
            <div class="center">www.samratcatering.com</div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        // Create an invisible iframe to hold the receipt
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();
        
        // Wait a tiny bit for the browser to render the styles, then print
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Clean up the invisible iframe after printing so they don't pile up
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 200);
      } else {
        Alert.alert("Notice", "Printing is currently configured for Web only.");
      }

    } catch (error) {
      console.error("Printing Error:", error);
      Alert.alert("Print Failed", "Could not generate the receipt.");
    }
  };

  const openStatusModal = (order) => { setSelectedOrder(order); setStatusModalVisible(true); };
  const openAssignModal = (order) => { setSelectedOrder(order); setAssignModalVisible(true); };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;
    await updateDoc(doc(db, 'orders', selectedOrder.id), { status: newStatus });
    setStatusModalVisible(false);
  };

  const handleAssignExec = async (exec) => {
    if (!selectedOrder) return;
    await updateDoc(doc(db, 'orders', selectedOrder.id), { assignedExecutiveId: exec.id, assignedExecutiveName: exec.name });
    setAssignModalVisible(false);
  };

  if (!appReady) return (
    <View style={styles.lockScreen}>
      <View style={styles.lockIconWrapper}><Ionicons name="restaurant" size={40} color="#0f172a" /></View>
      <Text style={styles.lockTitle}>Samrat Catering</Text>
      <Text style={styles.lockSubtitle}>Kitchen Management System</Text>
      <TouchableOpacity style={styles.startButton} onPress={initSoundSystem}>
        <Text style={styles.startText}>START SHIFT</Text>
        <Ionicons name="arrow-forward" size={16} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>Live Orders</Text>
          <View style={styles.activeCountRow}>
            <View style={styles.activeDot} />
            <Text style={styles.subHeading}>{activeCount} Active Order{activeCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => { setIsAdminUnlocked(false); setAdminPin(''); setSettingsVisible(true); }}>
          <Ionicons name="settings-outline" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={{ width: 36 }} />
          <Text style={[styles.col, { flex: 0.8 }]}>STATUS</Text>
          <Text style={[styles.col, { flex: 1.1 }]}>ORDER NO.</Text>
          <Text style={[styles.col, { flex: 1.0 }]}>DATE</Text>
          <Text style={[styles.col, { flex: 0.8 }]}>TIME</Text>
          <Text style={[styles.col, { flex: 1.2 }]}>VENDOR</Text>
          <Text style={[styles.col, { flex: 1.2 }]}>TRAIN</Text>
          <Text style={[styles.col, { flex: 0.9 }]}>PAYMENT</Text>
          <Text style={[styles.col, { flex: 1.2, textAlign: 'center' }]}>ACTIONS</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 60 }} />
        ) : orders.filter(o => o.status === 'Active').length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={36} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>No active orders right now</Text>
          </View>
        ) : (
          <FlatList
            data={orders.filter(o => o.status === 'Active')}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ExpandableOrderRow item={item} onPrint={handlePrint} onEditStatus={openStatusModal} onAssign={openAssignModal} />}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
          />
        )}
      </View>

      <Modal visible={statusModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContainer}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor:'#16a34a'}]} onPress={() => handleUpdateStatus('Completed')}><Text style={styles.actionBtnText}>Mark as Delivered</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor:'#dc2626'}]} onPress={() => handleUpdateStatus('Cancelled')}><Text style={styles.actionBtnText}>Cancel Order</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor:'#f1f5f9', borderWidth:1, borderColor:'#e2e8f0'}]} onPress={() => setStatusModalVisible(false)}><Text style={[styles.actionBtnText, {color:'#0f172a'}]}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={assignModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContainer}>
            <Text style={styles.modalTitle}>Assign Delivery Executive</Text>
            <ScrollView style={{maxHeight: 300, width: '100%', marginBottom: 10}} showsVerticalScrollIndicator={false}>
              {executives.map(exec => (
                <TouchableOpacity key={exec.id} style={styles.execRow} onPress={() => handleAssignExec(exec)}>
                  <Ionicons name="person-circle-outline" size={24} color="#475569" /><Text style={styles.execName}>{exec.name}</Text>
                </TouchableOpacity>
              ))}
              {executives.length === 0 && <Text style={{textAlign:'center', color:'#94a3b8', padding: 20}}>No executives found.</Text>}
            </ScrollView>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor:'#f1f5f9', borderWidth:1, borderColor:'#e2e8f0', marginBottom: 0}]} onPress={() => setAssignModalVisible(false)}><Text style={[styles.actionBtnText, {color:'#0f172a'}]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={settingsVisible} transparent animationType="fade" onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Admin Panel</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}><Ionicons name="close" size={20} color="#64748b" /></TouchableOpacity>
            </View>
            {!isAdminUnlocked ? (
              <View>
                <Text style={styles.pinLabel}>Enter Admin PIN</Text>
                <TextInput style={styles.pinInput} placeholder="• • • •" keyboardType="numeric" secureTextEntry value={adminPin} onChangeText={setAdminPin} />
                <TouchableOpacity style={styles.unlockBtn} onPress={() => adminPin === '1234' ? setIsAdminUnlocked(true) : Alert.alert('Wrong PIN')}><Text style={styles.unlockBtnText}>Unlock</Text></TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.dangerWarning}>This will permanently delete all orders from the database.</Text>
                <TouchableOpacity style={styles.dangerBtn} onPress={handleMassDelete}><Ionicons name="trash-outline" size={16} color="white" /><Text style={styles.dangerBtnText}>Delete Entire Database</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, height: Platform.OS === 'web' ? '100vh' : '100%' },
  lockScreen: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  lockIconWrapper: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  lockTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  lockSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 36 },
  startButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 8 },
  startText: { color: '#0f172a', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  activeCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' },
  subHeading: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  settingsBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  tableContainer: { flex: 1, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  col: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  cardContainer: { borderBottomWidth: 1, borderColor: '#f1f5f9' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', backgroundColor: 'white' },
  tableRowExpanded: { backgroundColor: '#f8fafc' },
  cell: { fontSize: 13, color: '#334155' },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1, alignSelf: 'flex-start' },
  paymentTag: { fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', letterSpacing: 0.5 },
  iconBtn: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyStateText: { fontSize: 14, color: '#94a3b8' },
  expandedContent: { backgroundColor: '#f8fafc', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  expandedLayout: { flexDirection: 'row', gap: 16 },
  expandSectionLeft: { flex: 1.5, backgroundColor: 'white', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  miniTableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  miniHeadText: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.6 },
  miniTableRow: { flexDirection: 'row', padding: 9, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  miniCellText: { fontSize: 13, color: '#334155' },
  expandSectionMid: { flex: 1, padding: 12, backgroundColor: 'white', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 8 },
  remarkText: { fontSize: 13, color: '#0f172a', fontWeight: '500', marginBottom: 3 },
  remarkBox: { marginTop: 10, padding: 10, backgroundColor: '#fffbeb', borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
  remarkAlertText: { fontSize: 10, fontWeight: '700', color: '#b45309', marginBottom: 3, letterSpacing: 0.5 },
  remarkContentText: { fontSize: 12, color: '#92400e', fontWeight: '600', lineHeight: 16 },
  assignedBadgeBox: { marginTop: 12, padding: 10, backgroundColor: '#f0fdf4', borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  assignedBadgeLabel: { fontSize: 10, fontWeight: '700', color: '#16a34a', marginBottom: 2, letterSpacing: 0.5 },
  assignedBadgeName: { fontSize: 13, fontWeight: '700', color: '#14532d' },
  expandSectionRight: { flex: 1, backgroundColor: 'white', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', padding: 12 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  financeLabel: { fontSize: 12, color: '#64748b' },
  financeValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  financeDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  amountToCollectBar: { backgroundColor: '#0f172a', padding: 10, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  atcLabel: { color: '#94a3b8', fontWeight: '700', fontSize: 10, letterSpacing: 0.8 },
  atcValue: { color: 'white', fontWeight: '800', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: 'white', width: 360, borderRadius: 10, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pinLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  pinInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 12, textAlign: 'center', fontSize: 18, letterSpacing: 8, marginBottom: 12, color: '#0f172a', backgroundColor: '#f8fafc' },
  unlockBtn: { backgroundColor: '#0f172a', padding: 12, borderRadius: 6, alignItems: 'center' },
  unlockBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  dangerWarning: { fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 18 },
  dangerBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#dc2626', padding: 13, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dangerBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  actionModalContainer: { backgroundColor: 'white', width: 320, borderRadius: 10, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', alignItems:'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  actionBtn: { width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { color: 'white', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },
  execRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#f1f5f9', width: '100%', gap: 10 },
  execName: { fontSize: 14, fontWeight: '600', color: '#0f172a' }
});