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
    if (!code) return
    const unsub = onSnapshot(doc(db, 'rooms', code), (snap) => {
      setLoaded(true)
      if (!snap.exists()) { setRoom(null); return }
      setRoom(snap.data() as Room)
    }, (err) => {
      console.error('[room] onSnapshot error:', err)
      setLoaded(true)
    })
    return () => unsub()
  }, [code])

  useEffect(() => {
    if (!code) return
    return subscribePlayers(code, setPlayers)
  }, [code])

  useEffect(() => {
    if (!code) return
    return subscribeChat(code, setChat)
  }, [code])

  useEffect(() => {
    if (!code) return
    getQuestions(code).then(setQuestions)
  }, [code])

  const me = players.find(p => p.id === myId)
  const isHost = me?.isHost || false

  if (!loaded) return (
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
      {room!.status === 'lobby' && (
        <LobbyView room={room!} players={players} myId={myId} isHost={isHost} chat={chat} code={code} />
      )}
      {room!.status === 'playing' && (
        <GameView room={room!} players={players} questions={questions} myId={myId} code={code} />
      )}
      {room!.status === 'results' && (
        <ResultsView players={players} myId={myId} isHost={isHost} code={code} />
      )}
    </div>
  )
}
