export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AppConfig {
  firebase: FirebaseConfig;
  useEmulator: boolean;
  environment: "development" | "staging" | "production";
}

const config: AppConfig = {
  firebase: {
    apiKey: "AIzaSyA4as7taMc-gModOCwSqgzrHLBacBrn8MM",
    authDomain: "budget-9d6f7.firebaseapp.com",
    projectId: "budget-9d6f7",
    storageBucket: "budget-9d6f7.firebasestorage.app",
    messagingSenderId: "330754043571",
    appId: "1:330754043571:web:01a6ac5a7a2be578510ac6",
  },
  useEmulator: true,
  environment: "development",
};

export function getConfig(): AppConfig {
  return config;
}

export function getFirebaseConfig(): FirebaseConfig {
  return config.firebase;
}

export function isEmulatorMode(): boolean {
  return config.useEmulator;
}

export default getConfig;
