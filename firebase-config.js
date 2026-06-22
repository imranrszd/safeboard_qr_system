// ====================================================================
//  SafeBoard — Firebase setup  (browser / "compat" build)
//  Loaded as a plain <script> after the firebase-*-compat.js SDKs.
//  Step-by-step instructions are in SETUP_FIREBASE.md
// ====================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDh5B3XT41bREIf7mZJqSyBbf42C0yAXcE",
  authDomain: "safeboard-38be2.firebaseapp.com",
  databaseURL: "https://safeboard-38be2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "safeboard-38be2",
  storageBucket: "safeboard-38be2.firebasestorage.app",
  messagingSenderId: "302837309636",
  appId: "1:302837309636:web:4135a047346562fe3a2991",
  measurementId: "G-G1G7ZN2XPV"
};

// Which platform this screen belongs to. Every screen pointing at the same
// STATION_ID shares one live state. Use different ids to run several platforms.
const STATION_ID = 'sentral-p4';

(function () {
  if (typeof firebase === 'undefined') {
    console.warn('[SafeBoard] Firebase SDK not loaded — running offline (no live sync).');
    return;
  }
  firebase.initializeApp(firebaseConfig);
  window.SB_DB = firebase.database();
  window.SB_REF = window.SB_DB.ref('stations/' + STATION_ID);
  console.log('[SafeBoard] Live sync connected to stations/' + STATION_ID);
})();
