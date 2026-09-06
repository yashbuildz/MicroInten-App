// ─────────────────────────────────────────────────────────────
//  AuthService.js — Firebase REST API
//  Works in Expo Go — no native modules needed
// ─────────────────────────────────────────────────────────────

import { AUTH_URL, DB_URL, API_KEY } from '../config/Firebase';

// ── Helper: save document to Firestore via REST ───────────────
const saveToFirestore = async (collection, docId, data) => {
  // Convert JS object to Firestore REST format
  const fields = {};
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string')  fields[key] = { stringValue: value };
    else if (typeof value === 'number') fields[key] = { integerValue: value };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (value === null) fields[key] = { nullValue: null };
    else fields[key] = { stringValue: String(value) };
  });

  const res = await fetch(
    `${DB_URL}/${collection}/${docId}?key=${API_KEY}`,
    {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fields }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to save data');
  }
  return res.json();
};

// ── Helper: get document from Firestore via REST ──────────────
const getFromFirestore = async (collection, docId) => {
  const res = await fetch(
    `${DB_URL}/${collection}/${docId}?key=${API_KEY}`
  );
  if (!res.ok) throw new Error('Document not found');
  const data = await res.json();

  // Convert Firestore REST format back to plain JS object
  const result = {};
  Object.entries(data.fields || {}).forEach(([key, val]) => {
    result[key] = val.stringValue ?? val.integerValue ?? val.booleanValue ?? val.nullValue ?? null;
  });
  return result;
};

// ── Register ──────────────────────────────────────────────────
export const registerUser = async ({ name, email, password, role, extra }) => {
  // 1. Create user in Firebase Auth
  const authRes = await fetch(
    `${AUTH_URL}:signUp?key=${API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const authData = await authRes.json();
  if (!authRes.ok) {
    const code = authData.error?.message || 'REGISTER_FAILED';
    const messages = {
      'EMAIL_EXISTS':           'This email is already registered.',
      'WEAK_PASSWORD':          'Password must be at least 6 characters.',
      'INVALID_EMAIL':          'Invalid email address.',
      'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many attempts. Try later.',
    };
    const err = new Error(messages[code] || 'Registration failed.');
    err.code = code;
    throw err;
  }

  const uid   = authData.localId;
  const token = authData.idToken;

  // 2. Save user to 'users' collection
  const userDoc = { uid, name, email, role, createdAt: new Date().toISOString() };
  await saveToFirestore('users', uid, userDoc);

  // 3. Save role-specific data
  if (role === 'student') {
    await saveToFirestore('students', uid, {
      ...userDoc,
      college:  extra?.college  || '',
      course:   extra?.course   || '',
      profileComplete: 10,
      appliedCount:    0,
      savedCount:      0,
    });
  } else if (role === 'business') {
    await saveToFirestore('businesses', uid, {
      ...userDoc,
      businessName: extra?.businessName || '',
      industry:     extra?.industry     || '',
      location:     extra?.location     || '',
      website:      extra?.website      || '',
      verified:     false,
    });
  }

  console.log('✅ User registered:', { uid, name, email, role });
  return { uid, name, email, role, token };
};

// ── Login ─────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const authRes = await fetch(
    `${AUTH_URL}:signInWithPassword?key=${API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const authData = await authRes.json();
  if (!authRes.ok) {
    const code = authData.error?.message || 'LOGIN_FAILED';
    const messages = {
      'EMAIL_NOT_FOUND':        'No account found with this email.',
      'INVALID_PASSWORD':       'Incorrect password.',
      'INVALID_LOGIN_CREDENTIALS': 'Incorrect email or password.',
      'USER_DISABLED':          'This account has been disabled.',
      'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many attempts. Try later.',
    };
    const err = new Error(messages[code] || 'Login failed.');
    err.code = code;
    throw err;
  }

  const uid = authData.localId;

  // Fetch user profile from Firestore
  const userDoc = await getFromFirestore('users', uid);

  console.log('✅ User logged in:', userDoc);
  return { uid, ...userDoc, token: authData.idToken };
};

// ── Logout ────────────────────────────────────────────────────
export const logoutUser = async () => {
  // JWT tokens are stateless — just clear from local storage in app
  console.log('User logged out');
};

// ── Password Reset ────────────────────────────────────────────
export const resetPassword = async (email) => {
  await fetch(`${AUTH_URL}:sendOobCode?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
  });
};

export default registerUser;