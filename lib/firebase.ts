import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)

// ── Types ──────────────────────────────────────────────────────────────────

export type Room = {
  code: string
  status: 'lobby' | 'playing' | 'results'
  currentQuestion: number
  hostId: string
  createdAt: number
}

export type Player = {
  id: string
  roomCode: string
  nickname: string
  isHost: boolean
  isReady: boolean
  score: number
  joinedAt: number
}

export type Question = {
  id: string
  text: string
  orderIndex: number
}

export type Vote = {
  id: string
  voterId: string
  votedForId: string
  questionIndex: number
}

export type ChatMessage = {
  id: string
  playerId: string
  nickname: string
  message: string
  createdAt: number
}
