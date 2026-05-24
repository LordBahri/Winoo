import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';
import { useScanStore } from '@stores/scan.store';
import { NFCScanRing } from '@components/nfc/NFCScanRing';
import { TagFoundCard } from '@components/nfc/TagFoundCard';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const { colors, isDark } = useTheme();
  const {
    isScanning,
    isNfcSupported,
    scannedPet,
    error,
    startScan,
    cancelScan,
    clearScan,
  } = useScanStore();

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(60);

  useEffect(() => {
    if (scannedPet) {
      cardOpacity.value = withSpring(1);
      cardTranslateY.value = withSpring(0, { damping: 16, stiffness: 160 });
    } else {
      cardOpacity.value = withTiming(0, { duration: 200 });
      cardTranslateY.value = withTiming(60, { duration: 200 });
    }
  }, [scannedPet]);

  const resultStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleStartScan = async () => {
    if (!isNfcSupported) {
      Alert.alert(
        'NFC Not Available',
        'Your device does not support NFC scanning. You can still use the app to manage your pets.',
        [{ text: 'OK' }],
      );
      return;
    }
    await startScan();
  };

  const handleClose = () => {
    clearScan();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#0A0A1A' }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan NFC Tag</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scan area */}
        {!scannedPet && (
          <View style={styles.scanArea}>
            <View style={styles.ringContainer}>
              <NFCScanRing isScanning={isScanning} color="#0A84FF" />
              {/* Center icon */}
              <View style={styles.centerCircle}>
                <Text style={{ fontSize: 52 }}>{isScanning ? '📡' : '🏷️'}</Text>
              </View>
            </View>

            <Text style={styles.scanTitle}>
              {isScanning
                ? 'Hold near NFC tag...'
                : isNfcSupported
                ? 'Tap to start scanning'
                : 'NFC not available'}
            </Text>
            <Text style={styles.scanSubtitle}>
              {isScanning
                ? 'Keep your phone close to the pet tag until it vibrates'
                : 'Place your phone against your pet\'s NFC identification tag'}
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isScanning ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={cancelScan}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  !isNfcSupported && styles.disabledBtn,
                ]}
                onPress={handleStartScan}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>
                  {isNfcSupported ? '📡 Start Scanning' : 'NFC Unavailable'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Result card */}
        {scannedPet && (
          <Animated.View style={[styles.resultContainer, resultStyle]}>
            <TagFoundCard
              profile={scannedPet}
              onClose={() => {
                clearScan();
              }}
            />
            <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { clearScan(); }}>
              <Text style={styles.scanAgainText}>Scan another tag</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  centerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(10,132,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(10,132,255,0.4)',
    position: 'absolute',
  },
  scanTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  scanSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorBanner: {
    marginTop: 20,
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
  },
  errorText: { color: '#FF453A', fontSize: 14, textAlign: 'center' },
  startBtn: {
    marginTop: 40,
    backgroundColor: '#0A84FF',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  disabledBtn: { opacity: 0.4 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cancelBtn: {
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  resultContainer: { flex: 1, justifyContent: 'center' },
  scanAgainBtn: { alignItems: 'center', paddingVertical: 16 },
  scanAgainText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
});
