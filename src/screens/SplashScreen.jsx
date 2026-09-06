import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING } from '../theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(0.7)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const taglineOpacity= useRef(new Animated.Value(0)).current;
  const lineWidth     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo fades + scales in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
        }),
      ]),
      // 2. Brand name appears
      Animated.timing(textOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // 3. Gold line expands
      Animated.timing(lineWidth, {
        toValue: 1, duration: 500, useNativeDriver: false,
      }),
      // 4. Tagline appears
      Animated.timing(taglineOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // 5. Hold then exit
      Animated.delay(900),
    ]).start(() => {
      onFinish && onFinish();
    });
  }, []);

  const animatedLineStyle = {
    width: lineWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 200],
    }),
  };

  return (
    <View style={styles.root}>

      {/* Subtle background glow */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand name */}
      <Animated.Text style={[styles.brandName, { opacity: textOpacity }]}>
        MICRO<Text style={styles.brandAccent}>INTERNS</Text>
      </Animated.Text>

      {/* Gold divider line */}
      <Animated.View style={[styles.line, animatedLineStyle]} />

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        LEARN. EARN. GROW.
      </Animated.Text>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Subtle radial glow blobs
  glowTop: {
    position: 'absolute',
    top: -100,
    left: width / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#C9A84C',
    opacity: 0.04,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: width / 2 - 180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#C9A84C',
    opacity: 0.03,
  },

  // Logo
  logoWrap: {
    marginBottom: SPACING.lg,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  logo: {
    width: 120,
    height: 120,
  },

  // Text
  brandName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPri,
    letterSpacing: 6,
    marginBottom: SPACING.sm,
  },
  brandAccent: {
    color: COLORS.gold,
  },

  // Gold line
  line: {
    height: 1.5,
    backgroundColor: COLORS.gold,
    marginBottom: SPACING.sm,
    opacity: 0.8,
  },

  // Tagline
  tagline: {
    fontSize: 11,
    color: COLORS.textSec,
    letterSpacing: 4,
  },
});