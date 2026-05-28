'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createRoom, createPlayer, createQuestions, getRoom } from '@/lib/db'

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!nickname.trim()) return setError('Enter a nickname')
    setLoading(true); setError('')
    try {
      const code = generateCode()
      const playerId = crypto.randomUUID()
      await createRoom(code, playerId)
      console.log('room created')
      await createPlayer(code, nickname.trim(), true, playerId)
      console.log('player created')
      await createQuestions(code)
      console.log('questions created')
      localStorage.setItem('playerId', playerId)
      localStorage.setItem('nickname', nickname.trim())
      localStorage.setItem('roomCode', code)
      await new Promise(r => setTimeout(r, 500))
      router.push(`/room/${code}`)
    } catch (e: any) {
      setError(e.message || 'Failed to create room')
    } finally { setLoading(false) }
  }

  async function handleJoin() {
    if (!nickname.trim()) return setError('Enter a nickname')
    if (roomCode.length !== 4) return setError('Enter a 4-digit code')
    setLoading(true); setError('')
    try {
      const room = await getRoom(roomCode.trim())
      if (!room) throw new Error('Room not found — check the code!')
      if (room.status !== 'lobby') throw new Error('Game already in progress')
      const playerId = await createPlayer(roomCode.trim(), nickname.trim(), false)
      localStorage.setItem('playerId', playerId)
      localStorage.setItem('nickname', nickname.trim())
      localStorage.setItem('roomCode', roomCode.trim())
      router.push(`/room/${roomCode.trim()}`)
    } catch (e: any) {
      setError(e.message || 'Failed to join room')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 -left-24 w-72 h-72 bg-neon/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-ember/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4 select-none"
          >🎉</motion.div>
          <h1 className="font-display text-5xl font-extrabold text-gradient tracking-tight">PartyPulse</h1>
          <p className="text-ghost text-sm mt-2">Who knows who the best?</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'home' && (
            <motion.div key="home"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button onClick={() => setMode('create')}
                className="relative w-full py-4 rounded-2xl bg-neon text-white font-display font-bold text-lg glow-purple overflow-hidden transition-all active:scale-95 btn-glow">
                Create Room ✨
              </button>
              <button onClick={() => setMode('join')}
                className="w-full py-4 rounded-2xl bg-card border border-border text-text font-display font-bold text-lg transition-all active:scale-95 hover:border-neon/40">
                Join Room 🚀
              </button>
            </motion.div>
          )}

          {(mode === 'create' || mode === 'join') && (
            <motion.div key={mode}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-ghost text-xs uppercase tracking-widest mb-2 block">Your Nickname</label>
                <input
                  type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                  placeholder="e.g. ChaosGremlin" maxLength={20} autoFocus
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-neon/50 transition-colors"
                />
              </div>

              {mode === 'join' && (
                <div>
                  <label className="text-ghost text-xs uppercase tracking-widest mb-2 block">Room Code</label>
                  <input
                    type="text" value={roomCode}
                    onChange={e => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234" inputMode="numeric" maxLength={4}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text placeholder-muted font-display text-3xl text-center tracking-[0.5em] focus:outline-none focus:border-neon/50 transition-colors"
                  />
                </div>
              )}

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose text-sm text-center">
                  ⚠ {error}
                </motion.p>
              )}

              <button onClick={mode === 'create' ? handleCreate : handleJoin} disabled={loading}
                className="relative w-full py-4 rounded-2xl bg-neon text-white font-display font-bold text-lg glow-purple overflow-hidden transition-all active:scale-95 disabled:opacity-50 btn-glow">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === 'create' ? 'Creating...' : 'Joining...'}
                    </span>
                  : mode === 'create' ? 'Create Room ✨' : 'Join Room 🚀'
                }
              </button>

              <button onClick={() => { setMode('home'); setError('') }}
                className="w-full py-3 text-ghost text-sm hover:text-soft transition-colors">
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
