import {
  doc, collection, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy,
  serverTimestamp, where, writeBatch,
} from 'firebase/firestore'
import { db, type Room, type Player, type Question, type Vote, type ChatMessage } from './firebase'
import { pickRandomQuestions } from './questions'

// ── Room ──────────────────────────────────────────────────────────────────

export async function createRoom(code: string, hostId: string) {
  await setDoc(doc(db, 'rooms', code), {
    code,
    status: 'lobby',
    currentQuestion: 0,
    hostId,
    createdAt: Date.now(),
  })
}

export async function getRoom(code: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, 'rooms', code))
  return snap.exists() ? (snap.data() as Room) : null
}

export function subscribeRoom(code: string, cb: (room: Room) => void) {
  return onSnapshot(doc(db, 'rooms', code), snap => {
    if (snap.exists()) cb(snap.data() as Room)
  })
}

export async function updateRoom(code: string, data: Partial<Room>) {
  await updateDoc(doc(db, 'rooms', code), data)
}

// ── Players ───────────────────────────────────────────────────────────────

export async function createPlayer(roomCode: string, nickname: string, isHost: boolean): Promise<string> {
  const ref = doc(collection(db, 'rooms', roomCode, 'players'))
  await setDoc(ref, {
    id: ref.id,
    roomCode,
    nickname,
    isHost,
    isReady: isHost, // host is always ready
    score: 0,
    joinedAt: Date.now(),
  })
  return ref.id
}

export async function updatePlayer(roomCode: string, playerId: string, data: Partial<Player>) {
  await updateDoc(doc(db, 'rooms', roomCode, 'players', playerId), data)
}

export async function deletePlayer(roomCode: string, playerId: string) {
  await deleteDoc(doc(db, 'rooms', roomCode, 'players', playerId))
}

export function subscribePlayers(roomCode: string, cb: (players: Player[]) => void) {
  const q = query(collection(db, 'rooms', roomCode, 'players'), orderBy('joinedAt'))
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as Player))
  })
}

// ── Questions ─────────────────────────────────────────────────────────────

export async function createQuestions(roomCode: string): Promise<Question[]> {
  const texts = pickRandomQuestions(5)
  const batch = writeBatch(db)
  const questions: Question[] = texts.map((text, i) => {
    const ref = doc(collection(db, 'rooms', roomCode, 'questions'))
    const q: Question = { id: ref.id, text, orderIndex: i }
    batch.set(ref, q)
    return q
  })
  await batch.commit()
  return questions
}

export async function getQuestions(roomCode: string): Promise<Question[]> {
  const snap = await getDocs(
    query(collection(db, 'rooms', roomCode, 'questions'), orderBy('orderIndex'))
  )
  return snap.docs.map(d => d.data() as Question)
}

// ── Votes ─────────────────────────────────────────────────────────────────

export async function castVote(roomCode: string, questionIndex: number, voterId: string, votedForId: string) {
  const ref = doc(db, 'rooms', roomCode, 'votes', `${questionIndex}_${voterId}`)
  await setDoc(ref, { id: ref.id, voterId, votedForId, questionIndex })
}

export function subscribeVotes(roomCode: string, questionIndex: number, cb: (votes: Vote[]) => void) {
  const q = query(
    collection(db, 'rooms', roomCode, 'votes'),
    where('questionIndex', '==', questionIndex)
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as Vote))
  })
}

export async function getVotesForQuestion(roomCode: string, questionIndex: number): Promise<Vote[]> {
  const snap = await getDocs(
    query(collection(db, 'rooms', roomCode, 'votes'), where('questionIndex', '==', questionIndex))
  )
  return snap.docs.map(d => d.data() as Vote)
}

// ── Chat ──────────────────────────────────────────────────────────────────

export async function sendChatMessage(roomCode: string, playerId: string, nickname: string, message: string) {
  await addDoc(collection(db, 'rooms', roomCode, 'chat'), {
    playerId,
    nickname,
    message,
    createdAt: Date.now(),
  })
}

export function subscribeChat(roomCode: string, cb: (messages: ChatMessage[]) => void) {
  const q = query(collection(db, 'rooms', roomCode, 'chat'), orderBy('createdAt'))
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)))
  })
}
