import { getPools } from "../src/operations/pools.js";

async function test() {
  try {
    console.log("Testing connection to your demo data...");
    const pools = await getPools("test-budget-456");
    console.log("✅ Success! Found", pools.length, "pools");
    console.log(
      "Pool names:",
      pools.map((p) => p.name)
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

test();
