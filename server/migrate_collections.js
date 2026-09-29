import "dotenv/config";
import admin from "firebase-admin";

async function runMigration() {
  console.log("Starting Database Migration...");

  let db = null;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      console.log("🔥 Firebase Admin Initialized");
    } else {
      console.error("⚠️ FIREBASE_SERVICE_ACCOUNT not found in .env. Cannot migrate.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    process.exit(1);
  }

  // Helper to copy collections
  async function copyCollection(sourceName, targetName) {
    console.log(`\nCopying [${sourceName}] -> [${targetName}]...`);
    const sourceRef = db.collection(sourceName);
    const targetRef = db.collection(targetName);

    const snapshot = await sourceRef.get();
    if (snapshot.empty) {
      console.log(`Source collection '${sourceName}' is empty. Nothing to copy.`);
      return;
    }

    let count = 0;
    const batchSize = 500;
    let batch = db.batch();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const newDocRef = targetRef.doc(doc.id); // keep same ID
      batch.set(newDocRef, data);
      count++;

      if (count % batchSize === 0) {
        await batch.commit();
        console.log(`Committed ${count} documents...`);
        batch = db.batch();
      }
    }

    if (count % batchSize !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully copied ${count} documents from '${sourceName}' to '${targetName}'.`);
  }

  try {
    // 1. Copy 'services' (textile products) -> 'products'
    await copyCollection('services', 'products');

    // 2. Copy 'salon_services' -> 'services'
    await copyCollection('salon_services', 'services');

    console.log("\n🎉 Migration phase 1 (Data Copy) completed successfully!");
    console.log("IMPORTANT: The old collections ('services', 'salon_services') were NOT deleted. They serve as a backup.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

runMigration();
