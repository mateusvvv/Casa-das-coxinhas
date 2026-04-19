import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsIsSupported } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJ44sEPw7nuX5UQFoPBn8gm162kxSGLvM",
  authDomain: "casa-das-coxinhas-5f0c5.firebaseapp.com",
  projectId: "casa-das-coxinhas-5f0c5",
  storageBucket: "casa-das-coxinhas-5f0c5.firebasestorage.app",
  messagingSenderId: "52078782768",
  appId: "1:52078782768:web:b7b15d3170918fe97700f5",
  measurementId: "G-9SCDSBMLSX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const availabilityRef = doc(db, "configuracoes", "disponibilidade");

const firebaseReady = (async () => {
  await setPersistence(auth, browserSessionPersistence);

  if (firebaseConfig.measurementId) {
    try {
      const analyticsSupported = await analyticsIsSupported();
      if (analyticsSupported) {
        getAnalytics(app);
      }
    } catch (error) {
      console.warn("Analytics não foi iniciado:", error);
    }
  }
})();

window.firebaseService = {
  async loadAvailability() {
    await firebaseReady;
    const snapshot = await getDoc(availabilityRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() || { itens: {}, lojaAberta: true };
  },

  async saveAvailability(data, lojaAberta) {
    await firebaseReady;
    await setDoc(availabilityRef, {
      itens: data,
      lojaAberta: lojaAberta,
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
  },

  async subscribeAvailability(callback) {
    await firebaseReady;

    return onSnapshot(availabilityRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(snapshot.data() || {});
    }, (error) => {
      console.error("Erro ao ouvir disponibilidade em tempo real:", error);
    });
  },

  async loginAdmin(email, senha) {
    await firebaseReady;
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    return credencial.user;
  },

  async logoutAdmin() {
    await firebaseReady;
    await signOut(auth);
  },

  onAdminAuthChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};
