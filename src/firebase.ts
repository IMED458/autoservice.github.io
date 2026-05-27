import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBIEQCCwOC4yhne6mu0SfjEmpRLYTa5Les',
  authDomain: 'autoservice-31801.firebaseapp.com',
  projectId: 'autoservice-31801',
  storageBucket: 'autoservice-31801.firebasestorage.app',
  messagingSenderId: '26118920894',
  appId: '1:26118920894:web:4250d0eee3a1cf7eb51cef',
  measurementId: 'G-Y1VYBHJ1CL',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
