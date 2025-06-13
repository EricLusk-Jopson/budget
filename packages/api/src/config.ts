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
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
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
