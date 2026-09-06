import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';

import SplashScreen        from './src/screens/SplashScreen';
import HomeScreen          from './src/screens/HomeScreen';
import LoginScreen         from './src/screens/LoginScreen';
import RegisterScreen      from './src/screens/RegisterScreen';
import StudentDashboard    from './src/screens/StudentDashboard';
import BusinessDashboard   from './src/screens/BusinessDashboard';
import BusinessChat        from './src/screens/BusinessChat';
import BusinessProfile     from './src/screens/BusinessProfile';
import StudentProfile      from './src/screens/StudentProfile';
import InternshipSearch    from './src/screens/InternshipSearch';
import StudentApplications from './src/screens/StudentApplications';
import AdminDashboard     from './src/screens/AdminDashboard';

function App() {
  const [screen, setScreen]   = useState('splash');
  const [role, setRole]       = useState(null);
  const [user, setUser]       = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);

  const go = (s) => setScreen(s);

  if (screen === 'splash')
    return <SplashScreen onFinish={() => go('home')} />;

  if (screen === 'home')
    return <HomeScreen onRoleSelect={(r) => { setRole(r); go('login'); }} />;

  if (screen === 'login')
    return (
      <LoginScreen
        role={role}
        onBack={() => go('home')}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setRole(loggedInUser.role);
          if (loggedInUser.role === 'student')  go('student_dashboard');
          if (loggedInUser.role === 'business') go('business_dashboard');
          if (loggedInUser.role === 'admin')    go('admin_dashboard');
        }}
        onGoRegister={() => go('register')}
      />
    );

  if (screen === 'register')
    return (
      <RegisterScreen
        role={role}
        onBack={() => go('login')}
        onRegisterSuccess={(u) => {
          setUser(u); setRole(u.role);
          if (u.role === 'student')  go('student_dashboard');
          if (u.role === 'business') go('business_dashboard');
        }}
      />
    );

  // ── Student screens ────────────────────────────────────────
  if (screen === 'student_dashboard')
    return (
      <StudentDashboard
        user={user}
        onLogout={() => { setUser(null); setRole(null); go('home'); }}
        onGoProfile={() => go('student_profile')}
        onGoSearch={() => go('internship_search')}
        onGoApplications={() => go('student_applications')}
        onApplyInternship={(internship) => {
          setSelectedInternship(internship);
          go('internship_search'); // open search with apply sheet
        }}
      />
    );

  if (screen === 'student_profile')
    return <StudentProfile user={user} onBack={() => go('student_dashboard')} />;

  if (screen === 'internship_search')
    return (
      <InternshipSearch
        user={user}
        onBack={() => go('student_dashboard')}
        initialInternship={selectedInternship}
        onClearInitial={() => setSelectedInternship(null)}
      />
    );

  if (screen === 'student_applications')
    return <StudentApplications user={user} onBack={() => go('student_dashboard')} />;

  // ── Business screens ───────────────────────────────────────
  if (screen === 'business_dashboard')
    return (
      <BusinessDashboard
        user={user}
        onLogout={() => { setUser(null); setRole(null); go('home'); }}
        onGoChat={() => go('business_chat')}
        onGoProfile={() => go('business_profile')}
      />
    );

  if (screen === 'business_chat')
    return <BusinessChat user={user} onBack={() => go('business_dashboard')} />;

  if (screen === 'business_profile')
    return <BusinessProfile user={user} onBack={() => go('business_dashboard')} />;

  // ── Admin ──────────────────────────────────────────────────
  if (screen === 'admin_dashboard')
    return (
      <AdminDashboard
        user={user}
        onLogout={() => { setUser(null); setRole(null); go('home'); }}
      />
    );

  return (
    <View style={styles.placeholder}>
      <ActivityIndicator color="#C9A84C" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder:      { flex: 1, backgroundColor: '#0A0A14', justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 64, marginBottom: 16 },
  placeholderTitle: { fontSize: 24, fontWeight: '700', color: '#C9A84C', marginBottom: 8 },
  placeholderSub:   { fontSize: 14, color: '#7A7898' },
});

registerRootComponent(App);
export default App;