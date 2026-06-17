import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useScanStore } from '@stores/scan.store';
import { NFCScanRing, type ScanStatus } from '@components/nfc/NFCScanRing';
import { TagFoundCard } from '@components/nfc/TagFoundCard';

const { height } = Dimensions.get('window');

function hapticLight() {
  Vibration.vibrate(Platform.OS === 'android' ? 30 : 10);
}
function hapticSuccess() {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 40, 60, 80]);
  } else {
    Vibration.vibrate(40);
  }
}
function hapticError() {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 80, 40, 80]);
  } else {
    Vibration.vibrate(80);
  }
}

const STATUS_LABELS: Record<string, string> = {
  idle_available:     'Tap to start scanning',
  idle_unavailable:   'NFC not available',
  scanning:           'Searching for tag…',
  success:            'Tag found!',
  error:              'Scan failed',
};

const STATUS_SUBLABELS: Record<string, string> = {
  idle_available:     "Place your phone against the pet’s NFC tag",
  idle_unavailable:   'Your device does not support NFC scanning',
  scanning:           'Hold your phone steady near the tag',
  success:            'Loading pet profile…',
  error:              'Try moving your phone closer to the tag',
};

export default function ScanScreen() {
  const {
    isScanning,
    isNfcSupported,
    scannedPet,
    cmacStatus,
    error,
    initNfc,
    startScan,
    cancelScan,
    clearScan,
  } = useScanStore();

  const prevScanning = useRef(false);
  const prevPet = useRef<typeof scannedPet>(null);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(height);

  const ringScale = useSharedValue(1);
  const textOpacity = useSharedValue(1);

  useEffect(() => {
    initNfc();
  }, []);

  // Haptics on state transitions
  useEffect(() => {
    if (isScanning && !prevScanning.current) {
      hapticLight();
    }
    prevScanning.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    if (scannedPet && !prevPet.current) {
      hapticSuccess();
      ringScale.value = withSpring(0.85, { damping: 18, stiffness: 200 });
      cardOpacity.value = withSpring(1);
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 160 });
    } else if (!scannedPet && prevPet.current) {
      cardOpacity.value = withTiming(0, { duration: 250 });
      cardTranslateY.value = withTiming(height, { duration: 300 });
      ringScale.value = withSpring(1, { damping: 18, stiffness: 200 });
    }
    prevPet.current = scannedPet;
  }, [scannedPet]);

  useEffect(() => {
    if (error) hapticError();
  }, [error]);

  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: withTiming(scannedPet ? 0.3 : 1, { duration: 300 }),
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const scanStatus: ScanStatus = scannedPet
    ? (cmacStatus === 'invalid' ? 'error' : 'success')
    : error
    ? 'error'
    : isScanning
    ? 'scanning'
    : 'idle';

  const stateKey = scannedPet
    ? 'success'
    : error
    ? 'error'
    : isScanning
    ? 'scanning'
    : isNfcSupported
    ? 'idle_available'
    : 'idle_unavailable';

  const handleStartScan = () => {
    if (!isNfcSupported) {
      Alert.alert(
        'NFC Not Available',
        'Your device does not support NFC scanning. You can still manage your pets in the app.',
        [{ text: 'OK' }],
      );
      return;
    }
    startScan();
  };

  const handleClose = () => {
    clearScan();
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan NFC Tag</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scan area */}
        <View style={styles.scanArea}>
          {/* Ring container */}
          <Animated.View style={[styles.ringWrapper, ringAnimStyle]}>
            <NFCScanRing status={scanStatus} />
            {/* Center circle */}
            <View style={[
              styles.centerCircle,
              scanStatus === 'success' && styles.centerCircleSuccess,
              scanStatus === 'error' && styles.centerCircleError,
            ]}>
              <Text style={styles.centerIcon}>
                {scanStatus === 'success' ? '✓' : scanStatus === 'error' ? '✕' : isScanning ? '📡' : '🏷️'}
              </Text>
            </View>
          </Animated.View>

          {/* Status text */}
          <Animated.View style={styles.statusBlock} key={stateKey} entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
            <Text style={[
              styles.scanTitle,
              scanStatus === 'success' && { color: '#30D158' },
              scanStatus === 'error' && { color: '#FF453A' },
            ]}>
              {STATUS_LABELS[stateKey]}
            </Text>
            <Text style={styles.scanSubtitle}>
              {STATUS_SUBLABELS[stateKey]}
            </Text>
          </Animated.View>

          {/* Error banner */}
          {error && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* CMAC status badge */}
          {cmacStatus && cmacStatus !== 'not_required' && (
            <Animated.View
              entering={FadeIn.delay(400).duration(400)}
              style={[
                styles.cmacBadge,
                cmacStatus === 'valid' ? styles.cmacBadgeValid : styles.cmacBadgeInvalid,
              ]}
            >
              <Text style={styles.cmacBadgeText}>
                {cmacStatus === 'valid' ? '🛡️ Cryptographically verified' : '⚠️ Could not verify tag authenticity'}
              </Text>
            </Animated.View>
          )}

          {/* Action buttons */}
          <View style={styles.actionArea}>
            {isScanning ? (
              <Animated.View entering={FadeIn.duration(300)}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelScan} activeOpacity={0.7}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : !scannedPet ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.startBtnWrapper}>
                <TouchableOpacity
                  style={[styles.startBtn, !isNfcSupported && styles.disabledBtn]}
                  onPress={handleStartScan}
                  activeOpacity={0.85}
                >
                  <Text style={styles.startBtnText}>
                    {isNfcSupported ? 'Start Scanning' : 'NFC Unavailable'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}
          </View>
        </View>

        {/* Result card overlay */}
        <Animated.View style={[styles.resultOverlay, cardAnimStyle]} pointerEvents={scannedPet ? 'auto' : 'none'}>
          {scannedPet && (
            <TagFoundCard
              profile={scannedPet}
              cmacStatus={cmacStatus}
              onClose={clearScan}
            />
          )}
          {scannedPet && (
            <TouchableOpacity style={styles.scanAgainBtn} onPress={clearScan}>
              <Text style={styles.scanAgainText}>Scan another tag</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020209' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },

  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  centerCircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(10,132,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircleSuccess: {
    backgroundColor: 'rgba(48,209,88,0.15)',
    borderColor: 'rgba(48,209,88,0.4)',
  },
  centerCircleError: {
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderColor: 'rgba(255,69,58,0.4)',
  },
  centerIcon: { fontSize: 40 },

  statusBlock: { alignItems: 'center', gap: 10, marginBottom: 24 },
  scanTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  scanSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  errorBanner: {
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.25)',
    marginBottom: 16,
    width: '100%',
  },
  errorText: { color: '#FF453A', fontSize: 14, textAlign: 'center' },

  cmacBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16,
  },
  cmacBadgeValid: {
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.25)',
  },
  cmacBadgeInvalid: {
    backgroundColor: 'rgba(255,159,10,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.25)',
  },
  cmacBadgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },

  actionArea: { alignItems: 'center', minHeight: 60 },
  startBtnWrapper: { alignItems: 'center' },
  startBtn: {
    backgroundColor: '#0A84FF',
    borderRadius: 18,
    paddingHorizontal: 40,
    paddingVertical: 18,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  disabledBtn: { opacity: 0.4, shadowOpacity: 0 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cancelText: { color: '#fff', fontSize: 17, fontWeight: '600' },

  resultOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 24,
  },
  scanAgainBtn: { alignItems: 'center', paddingVertical: 14 },
  scanAgainText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
});
