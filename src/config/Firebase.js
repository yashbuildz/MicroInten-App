// Firebase project config — REST API mode
// No native modules needed — works in Expo Go

export const FIREBASE_CONFIG = {
  apiKey:    "AIzaSyCCFcUkTr9iBRXemDg5RPcsMafZWEVPiKE",
  projectId: "microintern-bd467",
};

// REST API base URLs
export const AUTH_URL  = `https://identitytoolkit.googleapis.com/v1/accounts`;
export const DB_URL    = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
export const API_KEY   = FIREBASE_CONFIG.apiKey;