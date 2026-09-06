import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../theme';

const { width } = Dimensions.get('window');

// HomeScreen = role selection landing page
// After user picks a role they go to Login
export default function HomeScreen({ onRoleSelect }) {

  return (
    <SafeAreaView style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>MICRO<Text style={styles.brandAccent}>INTERNS</Text></Text>
        <Text style={styles.tagline}>LEARN. EARN. GROW.</Text>
      </View>

      {/* Heading */}
      <View style={styles.body}>
        <Text style={styles.headline}>Who are you?</Text>
        <Text style={styles.sub}>Choose your role to get started</Text>

        {/* Role cards */}
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={styles.roleCard}
            onPress={() => onRoleSelect(r.key)}
            activeOpacity={0.85}
          >
            <View style={[styles.roleIcon, { backgroundColor: r.iconBg }]}>
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>{r.title}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </View>
            <Text style={styles.roleArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

    </SafeAreaView>
  );
}

const ROLES = [
  {
    key: 'student',
    title: 'Student',
    desc: 'Find internships that match your skills',
    emoji: '🎓',
    iconBg: '#0F1E30',
  },
  {
    key: 'business',
    title: 'Local Business',
    desc: 'Post opportunities and hire smart interns',
    emoji: '🏢',
    iconBg: '#0F200F',
  },
  {
    key: 'admin',
    title: 'Admin',
    desc: 'Manage the platform and monitor activity',
    emoji: '🛡️',
    iconBg: '#1E1A0F',
  },
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: SPACING.sm,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPri,
    letterSpacing: 5,
  },
  brandAccent: {
    color: COLORS.gold,
  },
  tagline: {
    fontSize: 10,
    color: COLORS.textSec,
    letterSpacing: 3,
    marginTop: 4,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPri,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: SPACING.xl,
  },

  // Role cards
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPri,
    marginBottom: 3,
  },
  roleDesc: {
    fontSize: 12,
    color: COLORS.textSec,
    lineHeight: 18,
  },
  roleArrow: {
    fontSize: 22,
    color: COLORS.gold,
    fontWeight: '300',
  },
});