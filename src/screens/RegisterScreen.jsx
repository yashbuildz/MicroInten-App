import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING, RADIUS } from '../theme';
import { registerUser } from '../services/AuthService';

export default function RegisterScreen({
  role = 'student',
  onBack,
  onRegisterSuccess,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');

  const [selectedRole, setSelectedRole] = useState(role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      setError('');

      if (!name || !email || !password) {
        setError('Please fill all required fields');
        return;
      }

      setLoading(true);

      const extra =
        selectedRole === 'student'
          ? {
              college,
              course,
            }
          : {
              businessName,
              industry,
              location,
            };

      const user = await registerUser({
        name,
        email,
        password,
        role: selectedRole,
        extra,
      });

      if (onRegisterSuccess) {
        onRegisterSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <Text style={styles.title}>MICROINTERNS</Text>
            <Text style={styles.subtitle}>
              Create your account
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Role</Text>

            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'student' && styles.roleActive,
              ]}
              onPress={() => setSelectedRole('student')}
            >
              <Text style={styles.roleTitle}>🎓 Student</Text>
              <Text style={styles.roleSub}>
                Find internships and gain experience
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'business' && styles.roleActive,
              ]}
              onPress={() => setSelectedRole('business')}
            >
              <Text style={styles.roleTitle}>🏢 Business</Text>
              <Text style={styles.roleSub}>
                Post internships and hire talent
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textSec}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={COLORS.textSec}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textSec}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {selectedRole === 'student' ? (
              <>
                <Text style={styles.sectionTitle}>
                  Student Details
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="College Name"
                  placeholderTextColor={COLORS.textSec}
                  value={college}
                  onChangeText={setCollege}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Course"
                  placeholderTextColor={COLORS.textSec}
                  value={course}
                  onChangeText={setCourse}
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  Business Details
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Business Name"
                  placeholderTextColor={COLORS.textSec}
                  value={businessName}
                  onChangeText={setBusinessName}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Industry"
                  placeholderTextColor={COLORS.textSec}
                  value={industry}
                  onChangeText={setIndustry}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Location"
                  placeholderTextColor={COLORS.textSec}
                  value={location}
                  onChangeText={setLocation}
                />
              </>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.registerText}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scroll: {
    padding: SPACING.lg,
  },

  back: {
    color: COLORS.gold,
    fontSize: 16,
    marginBottom: SPACING.md,
  },

  logoWrap: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  title: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '700',
  },

  subtitle: {
    color: COLORS.textSec,
    marginTop: 6,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
  },

  roleCard: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: 10,
  },

  roleActive: {
    borderColor: COLORS.gold,
  },

  roleTitle: {
    color: COLORS.textPri,
    fontWeight: '700',
    fontSize: 15,
  },

  roleSub: {
    color: COLORS.textSec,
    marginTop: 4,
    fontSize: 12,
  },

  input: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.textPri,
    marginBottom: 12,
  },

  registerBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },

  registerText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },

  errorBox: {
    backgroundColor: '#2B1111',
    borderColor: '#5A1A1A',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  errorText: {
    color: '#FF6B6B',
  },
});