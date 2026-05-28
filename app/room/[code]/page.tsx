'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { subscribeRoom, subscribePlayers, subscribeChat, getQuestions } from '@/lib/db'
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
  const [ready, setReady] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('playerId') || ''
    const storedCode = localStorage.getItem('roomCode') || ''
    if (!id || storedCode !== code) { router.push('/'); return }
    setMyId(id)
  }, [code, router])

  // Subscribe to room
  useEffect(() => {
    if (!code) return
    const unsub = subscribeRoom(code, r => {
      setRoom(r)
      setNotFound(false)
    })
    // Detect missing room after a short delay
    const timeout = setTimeout(() => {
      if (!room) setNotFound(true)
    }, 5000)
    return () => { unsub(); clearTimeout(timeout) }
  }, [code])

  // Subscribe to players
  useEffect(() => {
    if (!code) return
    return subscribePlayers(code, setPlayers)
  }, [code])

  // Subscribe to chat
  useEffect(() => {
    if (!code) return
    return subscribeChat(code, setChat)
  }, [code])

  // Load questions once
  useEffect(() => {
    if (!code) return
    getQuestions(code).then(setQuestions)
  }, [code])

  // Ready when we have room + myId
  useEffect(() => {
    if (room && myId) setReady(true)
  }, [room, myId])

  const me = players.find(p => p.id === myId)
  const isHost = me?.isHost || false

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-rose text-lg">Room not found 😕</p>
      <button onClick={() => router.push('/')} className="text-ghost hover:text-soft transition-colors">← Go Home</button>
    </div>
  )

  if (!ready || !room) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full" />
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
