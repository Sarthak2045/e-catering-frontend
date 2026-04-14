import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons'; // 🟢 Added for the logo icon
import { auth } from '../firebaseConfig'; // 🟢 Correct path inside src

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.js handles the redirect automatically via onAuthStateChanged
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        
        {/* BRANDING HEADER */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIconBox}>
            <Ionicons name="restaurant" size={24} color="white" />
          </View>
          <Text style={styles.title}>Samrat POS</Text>
          <Text style={styles.subtitle}>Sign in to manage kitchen operations</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput 
              style={styles.input} 
              placeholder="admin@samrathotel.com" 
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#94a3b8"
              secureTextEntry 
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={styles.btn} 
            onPress={handleLogin} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.btnText}>AUTHENTICATE</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  card: { 
    backgroundColor: 'white', 
    padding: 40, 
    borderRadius: 12, 
    width: '100%', 
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  
  // Branding
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  logoIconBox: {
    backgroundColor: '#0f172a',
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#0f172a', 
    letterSpacing: -0.5,
    marginBottom: 6
  },
  subtitle: { 
    fontSize: 14, 
    color: '#64748b', 
    fontWeight: '500' 
  },
  
  // Form
  form: { 
    width: '100%' 
  },
  inputContainer: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: '#94a3b8', 
    marginBottom: 8, 
    letterSpacing: 0.8 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    backgroundColor: '#f8fafc',
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    fontSize: 15,
    color: '#0f172a'
  },
  
  // Action Button
  btn: { 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a', 
    paddingVertical: 14, 
    borderRadius: 8, 
    marginTop: 12 
  },
  btnText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 13,
    letterSpacing: 0.5 
  }
});