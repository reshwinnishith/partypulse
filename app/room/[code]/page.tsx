'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { subscribePlayers, subscribeChat, getQuestions } from '@/lib/db'
import type { Room, Player, Question, ChatMessage } from '@/lib/firebase'
import LobbyView from '@/components/LobbyView'
import GameView from '@/components/GameView'
import ResultsView from '@/components/ResultsView'

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  console.log('[room page] component mounted, code:', code)
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [myId, setMyId] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!code) return
    const id = localStorage.getItem('playerId') || ''
    if (!id) { router.push('/'); return }
    setMyId(id)
  }, [code, router])

  useEffect(() => {
    if (!code || !myId) {
      console.log('[room] skipping subscription, code:', code, 'myId:', myId)
      return
    }
    console.log('[room] starting onSnapshot for rooms/', code)
    const unsub = onSnapshot(
      doc(db, 'rooms', code),
      (snapshot) => {
        console.log('[room] snapshot received, exists:', snapshot.exists(), 'data:', JSON.stringify(snapshot.data()))
        setLoaded(true)
        setRoom(snapshot.exists() ? (snapshot.data() as Room) : null)
      },
      (err) => {
        console.error('[room] onSnapshot error:', err.message, err.code)
        setLoaded(true)
        setRoom(null)
      }
    )
    return () => {
      console.log('[room] unsubscribing room snapshot')
      unsub()
    }
  }, [code, myId])

  useEffect(() => {
    if (!code) return
    console.log('[room] subscribing players for', code)
    return subscribePlayers(code, (p) => {
      console.log('[room] players update, count:', p.length)
      setPlayers(p)
    })
  }, [code])

  useEffect(() => {
    if (!code) return
    return subscribeChat(code, setChat)
  }, [code])

  useEffect(() => {
    if (!code) return
    getQuestions(code).then((q) => {
      console.log('[room] questions loaded, count:', q.length)
      setQuestions(q)
    })
  }, [code])

  const me = players.find(p => p.id === myId)
  const isHost = me?.isHost || false

  if (!loaded || !myId) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full" />
    </div>
  )

  if (loaded && !room) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-rose text-lg">Room not found 😕</p>
      <button onClick={() => router.push('/')} className="text-ghost hover:text-soft transition-colors">← Go Home</button>
    </div>
  )

  return (
    <div className="min-h-screen">
      {room.status === 'lobby' && (
        <LobbyView room={room} players={players} myId={myId} isHost={isHost} chat={chat} code={code} />
      )}
      {room.status === 'playing' && (
        <GameView room={room} players={players} questions={questions} myId={myId} code={code} />
      )}
      {room.status === 'results' && (
        <ResultsView players={players} myId={myId} isHost={isHost} code={code} />
      )}
    </div>
  )
}
