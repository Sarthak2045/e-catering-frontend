import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where,
  orderBy
} from "firebase/firestore";
import { auth, db } from '../firebaseConfig'; // Ensure path is correct

// --- AUTH SERVICES ---

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Return a structure that matches what your app expects
    return {
      user: {
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        name: "Admin User" // Firebase Auth doesn't store name by default, hardcoding for now
      },
      token: userCredential.user.accessToken
    };
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

// --- MENU SERVICES ---

export const getMenuItems = async () => {
  const querySnapshot = await getDocs(collection(db, "menuItems"));
  const items = [];
  querySnapshot.forEach((doc) => {
    items.push({ _id: doc.id, ...doc.data() });
  });
  return items;
};

// --- ORDER SERVICES ---

export const createOrder = async (orderData) => {
  try {
    // Add 'createdAt' timestamp for sorting
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: new Date().toISOString(),
      status: "Active" // Default status
    });
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error("Error creating order: ", error);
    throw error;
  }
};

export const getOrders = async (statusFilter = 'All') => {
  const ordersRef = collection(db, "orders");
  let q;

  // Simple query construction
  if (statusFilter === 'All') {
    q = query(ordersRef); // Fetch all
  } else {
    q = query(ordersRef, where("status", "==", statusFilter));
  }

  const querySnapshot = await getDocs(q);
  const orders = [];
  querySnapshot.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() }); // Mapping Firestore ID to 'id'
  });
  
  // Sort by date (client-side sorting is easiest for now)
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const updateOrderStatus = async (orderId, newStatus) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: newStatus
  });
  return { id: orderId, status: newStatus };
};