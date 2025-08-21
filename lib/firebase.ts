import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCa7DTCASwGqNMTNBt7X7XozYcu5MtU7fA",
  authDomain: "sendora-9e14f.firebaseapp.com",
  databaseURL: "https://sendora-9e14f-default-rtdb.firebaseio.com",
  projectId: "sendora-9e14f",
  storageBucket: "sendora-9e14f.appspot.com",
  messagingSenderId: "844599229027",
  appId: "1:844599229027:web:d84914f9efe44a260dd656",
  measurementId: "G-9FYBEJNY7K",
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
