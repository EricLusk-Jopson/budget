const { getConfig, getFirebaseConfig } = require("../src/config.ts");

function testConfiguration() {
  console.log("🔧 Testing Firebase Configuration...\n");

  const config = getConfig();
  const firebaseConfig = getFirebaseConfig();

  console.log("📋 Environment Detection:");
  console.log(`  Current Environment: ${config.environment}`);
  console.log(`  Use Emulator: ${config.useEmulator}\n`);

  console.log("🔥 Firebase Configuration:");
  console.log(`  Project ID: ${firebaseConfig.projectId}`);
  console.log(`  Auth Domain: ${firebaseConfig.authDomain}\n`);

  console.log("🎉 Configuration test complete!");
}

testConfiguration();
