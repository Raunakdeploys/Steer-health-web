export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export const firebaseConfig: FirebaseAppletConfig = {
  projectId: "gen-lang-client-0652918589",
  appId: "1:279812355025:web:b982cfbf490612af2ea6f0",
  apiKey: "AIzaSyBnwcZ2FvZV9eCsVDfc4uaXqsMPcu9UHWk",
  authDomain: "gen-lang-client-0652918589.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixevidencestu-6c14818e-f8ab-4937-87d7-3be1b80cb5e9",
  storageBucket: "gen-lang-client-0652918589.firebasestorage.app",
  messagingSenderId: "279812355025",
  measurementId: "",
  oAuthClientId: "279812355025-g5k3vvepkqshb6beg2vasoe7f5m7i10b.apps.googleusercontent.com",
  recaptchaSiteKey: "",
};

export default firebaseConfig;
