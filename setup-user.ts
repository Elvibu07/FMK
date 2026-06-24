import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgN_GOhhl_O9poq6olgI9BbH3YbvhizKM",
  authDomain: "fmk-elviaheredia-2c0d3.firebaseapp.com",
  projectId: "fmk-elviaheredia-2c0d3",
  storageBucket: "fmk-elviaheredia-2c0d3.firebasestorage.app",
  messagingSenderId: "304112930620",
  appId: "1:304112930620:web:6bffba96376687304e1839"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupAdmin() {
  try {
    console.log("Creando usuario en Firebase Auth...");
    const userCredential = await createUserWithEmailAndPassword(auth, "elvialeonsh@gmail.com", "2005elvia");
    console.log("✅ Usuario creado con UID:", userCredential.user.uid);

    console.log("Asignando rol de Admin en Firestore...");
    await addDoc(collection(db, "user_roles"), {
      email: "elvialeonsh@gmail.com",
      rol: "admin",
      name: "Elvia"
    });
    console.log("✅ Rol de administrador asignado correctamente.");
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("⚠️ El usuario ya existe en Firebase Auth.");
      // Intentamos agregar el rol de todos modos por si faltaba
      await addDoc(collection(db, "user_roles"), {
        email: "elvialeonsh@gmail.com",
        rol: "admin",
        name: "Elvia"
      });
      console.log("✅ Rol de administrador asegurado.");
      process.exit(0);
    } else {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  }
}

setupAdmin();
