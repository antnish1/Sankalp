import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/ui';
import { routeSignedInUser, signIn } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const biometricUserKey = 'insureit.biometric.user-id';
const biometricRefreshTokenKey = 'insureit.biometric.refresh-token';
const legacyBiometricSessionKey = 'insureit.biometric.session';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [canEnrollBiometric, setCanEnrollBiometric] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingSession, setPendingSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  useEffect(() => {
    let active = true;
    async function checkBiometric() {
      try {
        const [compatible, enrolled, savedUserId, savedRefreshToken] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          AsyncStorage.getItem(biometricUserKey),
          SecureStore.getItemAsync(biometricRefreshTokenKey),
        ]);
        if (active) {
          setCanEnrollBiometric(Boolean(compatible && enrolled));
          setBiometricReady(Boolean(compatible && enrolled && savedUserId && savedRefreshToken));
        }
      } catch {
        if (active) setBiometricReady(false);
      }
    }
    void checkBiometric();
    return () => {
      active = false;
    };
  }, []);

  async function submit() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await signIn(email.trim(), password);
      if (data.user) {
        const [compatible, enrolled, savedUserId, savedRefreshToken] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          AsyncStorage.getItem(biometricUserKey),
          SecureStore.getItemAsync(biometricRefreshTokenKey),
        ]);
        setCanEnrollBiometric(Boolean(compatible && enrolled));
        if (compatible && enrolled && (savedUserId !== data.user.id || !savedRefreshToken)) {
          setPendingUser(data.user);
          setPendingSession(data.session);
          return;
        }
        await routeSignedInUser(data.user, router);
      }
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  async function enableBiometricForPendingUser() {
    if (!pendingUser || biometricLoading) return;
    setBiometricLoading(true);
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable InsureIT biometric login',
        cancelLabel: 'Skip',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await AsyncStorage.setItem(biometricUserKey, pendingUser.id);
        await saveSessionForBiometric(pendingSession);
        setBiometricReady(true);
      }
      await routeSignedInUser(pendingUser, router);
    } catch {
      setError('Biometric setup failed.');
    } finally {
      setBiometricLoading(false);
    }
  }

  async function skipBiometricForPendingUser() {
  if (!pendingUser) return;
  await routeSignedInUser(pendingUser, router);
}

  async function unlockWithBiometric() {
    if (biometricLoading || loading) return;
    setBiometricLoading(true);
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'InsureIT',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (!result.success) return;
      const restoredUser = await restoreBiometricSession();
      if (!restoredUser) {
        setBiometricReady(false);
        setError('No saved biometric login found.');
        return;
      }
      await routeSignedInUser(restoredUser, router);
    } catch {
      setError('Biometric unlock failed.');
    } finally {
      setBiometricLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <View style={styles.brandRow}>
              <InsureItMark />
              <View style={styles.brandCopy}>
                <Text style={styles.brandText}>InsureIT</Text>
                <Text style={styles.brandMeta}>Commercial Motor Claims</Text>
              </View>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroGlow} />
              <VehicleScene active={loading || biometricLoading} />
            </View>

            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <MaterialCommunityIcons name="fingerprint" size={24} color="#18A058" />
              </View>
              {error ? <Message type="error">{error}</Message> : null}
              <LoginField
                label="Email"
                icon="email-outline"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                editable={!loading && !biometricLoading && !pendingUser}
                disabled={loading || biometricLoading || Boolean(pendingUser)}
              />
              <LoginField
                label="Password"
                icon="lock-outline"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                editable={!loading && !biometricLoading && !pendingUser}
                disabled={loading || biometricLoading || Boolean(pendingUser)}
              />
              {pendingUser ? (
                <BiometricEnrollmentPanel
                  loading={biometricLoading}
                  supported={canEnrollBiometric}
                  onEnable={enableBiometricForPendingUser}
                  onSkip={skipBiometricForPendingUser}
                />
              ) : null}
              {loading || biometricLoading ? <ProcessingPanel biometric={biometricLoading} /> : null}
              {!pendingUser ? (
              <Pressable accessibilityRole="button" disabled={loading || biometricLoading} onPress={submit} style={[styles.primaryButton, (loading || biometricLoading) && styles.disabledButton]}>
                <Text style={styles.primaryButtonText}>{loading ? 'Logging in' : 'Login'}</Text>
              </Pressable>
              ) : null}
              {biometricReady ? (
                <Pressable accessibilityRole="button" disabled={loading || biometricLoading} onPress={unlockWithBiometric} style={styles.biometricButton}>
                  <MaterialCommunityIcons name="fingerprint" size={22} color="#0B63CE" />
                  <Text style={styles.biometricButtonText}>{biometricLoading ? 'Unlocking' : 'Login using biometrics'}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.footerCard}>
              <View style={styles.footerIcon}>
                <MaterialCommunityIcons name="account-plus-outline" size={21} color="#0B63CE" />
              </View>
              <Text style={styles.footerTitle}>Sign up</Text>
              <Link href="/signup" asChild>
                <Pressable accessibilityRole="button" style={styles.footerAction}>
                  <Text style={styles.footerActionText}>Open</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

async function saveSessionForBiometric(session: Session | null) {
  if (!session?.refresh_token) throw new Error('Missing refresh token.');
  await SecureStore.setItemAsync(biometricRefreshTokenKey, session.refresh_token);
  await SecureStore.deleteItemAsync(legacyBiometricSessionKey).catch(() => undefined);
}

async function restoreBiometricSession() {
  const refreshToken = await SecureStore.getItemAsync(biometricRefreshTokenKey);
  if (!refreshToken) return null;
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session?.user) return null;
  await saveSessionForBiometric(data.session);
  return data.session.user;
}

function InsureItMark() {
  return (
    <View style={styles.logoStack}>
      <View style={styles.logoBack} />
      <View style={styles.logoFront}>
        <MaterialCommunityIcons name="shield-check" size={22} color="#0B1F3A" />
      </View>
    </View>
  );
}

function VehicleScene({ active }: { active: boolean }) {
  const motion = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const motionLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration: 1450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration: 1450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    motionLoop.start();
    return () => motionLoop.stop();
  }, [motion]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulse]);

  useEffect(() => {
    if (!active) {
      scan.stopAnimation();
      scan.setValue(0);
      return;
    }
    const scanLoop = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
    );
    scanLoop.start();
    return () => scanLoop.stop();
  }, [active, scan]);

  const lift = motion.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const tilt = motion.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '3deg'] });
  const scanX = scan.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });

  return (
    <View style={styles.vehicleStage}>
      <Animated.View style={[styles.orbitRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
      <View style={styles.hologramPanel} />
      <Animated.View style={[styles.vehicleWrap, { transform: [{ translateY: lift }, { rotateZ: tilt }] }]}>
        <View style={styles.truckDepth} />
        <View style={styles.truckBody}>
          <View style={styles.truckCab}>
            <View style={styles.windshield} />
            <View style={styles.headLamp} />
          </View>
          <View style={styles.truckCargo}>
            <Text style={styles.cargoText}>INSUREIT</Text>
            <View style={styles.cargoLine} />
          </View>
          <View style={styles.wheelLeft} />
          <View style={styles.wheelRight} />
        </View>
      </Animated.View>
      {active ? <Animated.View style={[styles.scanLine, { transform: [{ translateX: scanX }] }]} /> : null}
      <View style={styles.heroBadge}>
        <MaterialCommunityIcons name="radar" size={16} color="#FFFFFF" />
        <Text style={styles.heroBadgeText}>Verified Fleet</Text>
      </View>
    </View>
  );
}

function ProcessingPanel({ biometric = false }: { biometric?: boolean }) {
  return (
    <View style={styles.processingPanel}>
      <View style={styles.processingIcon}>
        <ActivityIndicator color="#18A058" />
      </View>
      <Text style={styles.processingTitle}>{biometric ? 'Biometric login' : 'Logging in'}</Text>
    </View>
  );
}

function BiometricEnrollmentPanel({
  loading,
  supported,
  onEnable,
  onSkip,
}: {
  loading: boolean;
  supported: boolean;
  onEnable: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.enrollPanel}>
      <View style={styles.enrollIcon}>
        <MaterialCommunityIcons name={supported ? 'fingerprint' : 'lock-check-outline'} size={22} color={supported ? '#18A058' : '#667085'} />
      </View>
      <View style={styles.enrollCopy}>
        <Text style={styles.enrollTitle}>{supported ? 'Biometric login' : 'Device lock'}</Text>
        <Text style={styles.enrollText}>{supported ? 'Save biometric unlock for this account on this device.' : 'Biometric unlock is not available on this device.'}</Text>
      </View>
      <View style={styles.enrollActions}>
        {supported ? (
          <Pressable accessibilityRole="button" disabled={loading} onPress={onEnable} style={styles.enrollPrimary}>
            <Text style={styles.enrollPrimaryText}>{loading ? 'Saving' : 'Enable'}</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" disabled={loading} onPress={onSkip} style={styles.enrollSecondary}>
          <Text style={styles.enrollSecondaryText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoginField({ label, icon, disabled = false, ...props }: React.ComponentProps<typeof TextInput> & { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; disabled?: boolean }) {
  return (
    <View style={[styles.fieldWrap, disabled && styles.fieldDisabled]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <MaterialCommunityIcons name={icon} size={20} color="#667085" />
        <TextInput placeholderTextColor="#98A2B3" style={styles.input} {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF2F6' },
  keyboard: { flex: 1 },
  screen: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, marginBottom: 10 },
  logoStack: { width: 48, height: 48 },
  logoBack: { position: 'absolute', width: 39, height: 39, borderRadius: 16, backgroundColor: '#18A058', left: 6, top: 7, transform: [{ rotateZ: '8deg' }] },
  logoFront: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8DEE8', alignItems: 'center', justifyContent: 'center', shadowColor: '#0B1F3A', shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 },
  brandCopy: { flex: 1 },
  brandText: { color: '#0B1F3A', fontSize: 19, fontWeight: '900' },
  brandMeta: { color: '#667085', fontSize: 12, fontWeight: '800', marginTop: 2 },
  heroCard: { height: 118, borderRadius: 26, backgroundColor: '#0B1F3A', padding: 12, overflow: 'hidden', marginBottom: 12, shadowColor: '#0B1F3A', shadowOpacity: 0.15, shadowRadius: 14, elevation: 4 },
  heroGlow: { position: 'absolute', width: 132, height: 132, borderRadius: 66, right: -36, top: -38, backgroundColor: 'rgba(24,160,88,0.30)' },
  vehicleStage: { flex: 1, justifyContent: 'center' },
  orbitRing: { position: 'absolute', width: 188, height: 58, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)', alignSelf: 'center', transform: [{ rotateZ: '-7deg' }] },
  hologramPanel: { position: 'absolute', width: 210, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'center', bottom: 22, transform: [{ skewX: '-18deg' }] },
  vehicleWrap: { height: 76, justifyContent: 'center', marginTop: 8 },
  truckDepth: { position: 'absolute', width: 162, height: 48, borderRadius: 18, backgroundColor: '#06162A', alignSelf: 'center', top: 21, transform: [{ translateX: 7 }, { translateY: 7 }, { skewX: '-10deg' }] },
  truckBody: { width: 168, height: 54, borderRadius: 18, backgroundColor: '#FFFFFF', alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-end', padding: 7, shadowColor: '#FFFFFF', shadowOpacity: 0.16, shadowRadius: 10, elevation: 5 },
  truckCab: { width: 52, height: 39, borderRadius: 13, backgroundColor: '#18A058', marginRight: 6, padding: 6, justifyContent: 'space-between' },
  windshield: { width: 25, height: 12, borderRadius: 5, backgroundColor: '#C7D7EA', alignSelf: 'flex-end' },
  headLamp: { width: 10, height: 6, borderRadius: 3, backgroundColor: '#FFF4E5' },
  truckCargo: { flex: 1, height: 39, borderRadius: 12, backgroundColor: '#E8F1FB', padding: 8, justifyContent: 'center' },
  cargoText: { color: '#0B1F3A', fontSize: 11, fontWeight: '900' },
  cargoLine: { width: 50, height: 4, borderRadius: 2, backgroundColor: '#18A058', marginTop: 5 },
  wheelLeft: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#0B1F3A', left: 34, bottom: -6, borderWidth: 4, borderColor: '#C7D7EA' },
  wheelRight: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#0B1F3A', right: 32, bottom: -6, borderWidth: 4, borderColor: '#C7D7EA' },
  scanLine: { position: 'absolute', width: 52, height: 110, top: 0, left: '50%', backgroundColor: 'rgba(255,255,255,0.18)', transform: [{ rotateZ: '17deg' }] },
  heroBadge: { position: 'absolute', left: 0, top: 0, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  formCard: { borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8DEE8', padding: 14, marginBottom: 12, shadowColor: '#0B1F3A', shadowOpacity: 0.07, shadowRadius: 14, elevation: 2 },
  formHeader: { marginBottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  formTitle: { color: '#0B1F3A', fontSize: 22, fontWeight: '900' },
  fieldWrap: { marginBottom: 10 },
  fieldDisabled: { opacity: 0.45 },
  fieldLabel: { color: '#0B1F3A', fontSize: 13, fontWeight: '900', marginBottom: 7 },
  inputShell: { minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: '#D8DEE8', backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, color: '#0B1F3A', fontSize: 15, fontWeight: '700', minHeight: 50 },
  processingPanel: { borderRadius: 18, backgroundColor: '#EAF8F0', borderWidth: 1, borderColor: '#BFEBD0', padding: 11, marginTop: 2, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  processingIcon: { width: 34, height: 34, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  processingTitle: { color: '#067647', fontSize: 14, fontWeight: '900' },
  enrollPanel: { borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D8DEE8', padding: 12, marginBottom: 10, gap: 10 },
  enrollIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  enrollCopy: { gap: 2 },
  enrollTitle: { color: '#0B1F3A', fontSize: 15, fontWeight: '900' },
  enrollText: { color: '#667085', fontSize: 12, lineHeight: 17 },
  enrollActions: { flexDirection: 'row', gap: 9 },
  enrollPrimary: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#18A058', alignItems: 'center', justifyContent: 'center' },
  enrollPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  enrollSecondary: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8DEE8', alignItems: 'center', justifyContent: 'center' },
  enrollSecondaryText: { color: '#0B1F3A', fontSize: 13, fontWeight: '900' },
  primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#18A058', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  disabledButton: { opacity: 0.68 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  biometricButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#E8F1FB', borderWidth: 1, borderColor: '#B9D5FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  biometricButtonText: { color: '#0B63CE', fontSize: 14, fontWeight: '900' },
  footerCard: { minHeight: 64, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B9D5FF', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerIcon: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#E8F1FB', alignItems: 'center', justifyContent: 'center' },
  footerTitle: { color: '#0B1F3A', fontSize: 14, fontWeight: '900', flex: 1 },
  footerAction: { minHeight: 38, borderRadius: 14, backgroundColor: '#E8F1FB', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  footerActionText: { color: '#0B63CE', fontSize: 12, fontWeight: '900' },
});
