import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBy6KzxD9KZDtofc0MJzcNlRM9Jzt-DZUk",
  authDomain: "anjussaloon.firebaseapp.com",
  projectId: "anjussaloon",
  storageBucket: "anjussaloon.firebasestorage.app",
  messagingSenderId: "120160528567",
  appId: "1:120160528567:web:c8eedda81f2f15005b0532"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Starting DB Migration...");
  
  // 1. Migrate `services` to `products`
  console.log("Migrating 'services' -> 'products'...");
  const oldProductsSnap = await getDocs(collection(db, 'services'));
  let productsCount = 0;
  for (const oldDoc of oldProductsSnap.docs) {
    await setDoc(doc(db, 'products', oldDoc.id), oldDoc.data());
    productsCount++;
  }
  console.log(`Copied ${productsCount} documents to 'products'.`);

  // 2. Migrate `salon_services` to `services`
  console.log("Migrating 'salon_services' -> 'services'...");
  const oldServicesSnap = await getDocs(collection(db, 'salon_services'));
  let servicesCount = 0;
  for (const oldDoc of oldServicesSnap.docs) {
    await setDoc(doc(db, 'services', oldDoc.id), oldDoc.data());
    servicesCount++;
  }
  console.log(`Copied ${servicesCount} documents to 'services'.`);

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
