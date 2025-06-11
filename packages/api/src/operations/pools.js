import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";

export const getPools = async (budgetId) => {
  const poolsRef = collection(db, `budgets/${budgetId}/pools`);
  const snapshot = await getDocs(poolsRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
