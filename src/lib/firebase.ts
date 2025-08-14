
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  "projectId": "commerceai-1cfpf",
  "appId": "1:278577196265:web:989c746e72a099c4879478",
  "storageBucket": "commerceai-1cfpf.firebasestorage.app",
  "apiKey": "AIzaSyATVITY6DoWnCYMopBevPTbr_k63MeTCug",
  "authDomain": "commerceai-1cfpf.firebaseapp.com",
  "messagingSenderId": "278577196265"
};

const app = initializeApp(firebaseConfig);

export { app };
