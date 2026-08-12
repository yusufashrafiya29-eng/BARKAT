import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { waiterApi } from '../api/waiterApi';
import { COLORS, SHADOWS, RADIUS, FONT } from '../constants/theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await waiterApi.login(email, password);
      const tokenData = response.data || response;
      const { access_token, role, full_name, restaurant_id, restaurant_logo, restaurant_name } = tokenData;

      if (!['WAITER', 'RUNNER', 'OWNER', 'MANAGER'].includes(role)) {
        setError('Only Waiters, Runners, or Managers can use the Captain App.');
        return;
      }

      login(access_token, restaurant_id, restaurant_name, role, full_name || email.split('@')[0], restaurant_logo);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        {/* Background Pattern could be added here */}
        
        <View style={styles.topSection}>
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary]}
            style={styles.logoBox}
          >
            <Text style={styles.logoText}>MR</Text>
          </LinearGradient>
          <Text style={styles.title}>MyRestro</Text>
          <Text style={styles.subtitle}>Captain • Floor Staff</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Mail color={COLORS.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color={COLORS.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
              secureTextEntry={!showPassword}
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? (
                <EyeOff color={COLORS.textMuted} size={20} />
              ) : (
                <Eye color={COLORS.textMuted} size={20} />
              )}
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.buttonContainer} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login Securely</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
  },
  logoText: {
    color: COLORS.card,
    fontSize: 32,
    fontWeight: FONT.black,
  },
  title: {
    fontSize: 36,
    fontWeight: FONT.black,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: FONT.medium,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: 24,
    ...SHADOWS.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
    fontWeight: FONT.medium,
  },
  eyeBtn: {
    padding: 8,
    marginRight: -8,
  },
  buttonContainer: {
    marginTop: 8,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  button: {
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: FONT.bold,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 16,
    fontWeight: FONT.medium,
  },
  version: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
  }
});
