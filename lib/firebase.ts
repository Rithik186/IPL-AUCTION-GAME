import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)

// Initialize Analytics only in browser
let analytics: any = null
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

export { analytics }
