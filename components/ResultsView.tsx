'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updatePlayer, updateRoom, deletePlayer } from '@/lib/db'
import { writeBatch, doc, collection, getDocs } from 'firebase/firestore'
import { db as firestoreDb } from '@/lib/firebase'
import type { Player } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Confetti from './Confetti'

type Props = { players: Player[]; myId: string; isHost: boolean; code: string }

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_COLORS = ['text-spark', 'text-soft', 'text-ghost']

export default function ResultsView({ players, myId, isHost, code }: Props) {
  const router = useRouter()
  const [revealed, setRevealed] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const winner = sorted[0]
  const iWon = winner?.id === myId

  useEffect(() => {
    const interval = setInterval(() => {
      setRevealed(prev => {
        if (prev >= sorted.length) { clearInterval(interval); setTimeout(() => setShowConfetti(true), 400); return prev }
        return prev + 1
      })
    }, 450)
    return () => clearInterval(interval)
  }, [sorted.length])

  async function playAgain() {
    // Reset all player scores and ready states
    const batch = writeBatch(firestoreDb)
    players.forEach(p => {
      batch.update(doc(firestoreDb, 'rooms', code, 'players', p.id), { score: 0, isReady: false })
    })
    // Delete votes
    const votesSnap = await getDocs(collection(firestoreDb, 'rooms', code, 'votes'))
    votesSnap.forEach(d => batch.delete(d.ref))
    // Delete old questions and recreate them
    const questionsSnap = await getDocs(collection(firestoreDb, 'rooms', code, 'questions'))
    questionsSnap.forEach(d => batch.delete(d.ref))
    await batch.commit()

    // Recreate questions
    const { createQuestions } = await import('@/lib/db')
    await createQuestions(code)
    await updateRoom(code, { status: 'lobby', currentQuestion: 0 })
  }

  async function leaveRoom() {
    await deletePlayer(code, myId)
    localStorage.clear()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto relative overflow-hidden">
      {showConfetti && <Confetti />}

      <div className="absolute top-1/3 -left-20 w-60 h-60 bg-neon/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 -right-20 w-60 h-60 bg-ember/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center pt-8 mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 180 }}
          className="text-6xl mb-3 select-none">🎊</motion.div>
        <h1 className="font-display text-4xl font-extrabold text-gradient">Final Results</h1>
        {winner && revealed >= sorted.length && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-ghost text-sm mt-2">
            {iWon ? '🎉 You won!' : `${winner.nickname} takes the crown!`}
          </motion.p>
        )}
      </motion.div>

      {/* Leaderboard */}
      <div className="flex-1 space-y-3">
        <AnimatePresence>
          {sorted.map((player, i) => i < revealed ? (
            <motion.div key={player.id}
              initial={{ opacity: 0, scale: 0.85, x: i % 2 === 0 ? -40 : 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className={`relative flex items-center justify-between px-4 py-4 rounded-2xl border overflow-hidden ${
                i === 0 ? 'bg-gradient-to-r from-spark/20 to-ember/10 border-spark/50'
                : i === 1 ? 'bg-gradient-to-r from-soft/10 to-transparent border-soft/30'
                : 'bg-card border-border'
              }`}
            >
              {/* Winner shine */}
              {i === 0 && (
                <motion.div initial={{ x: '-100%' }} animate={{ x: '200%' }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                />
              )}
              <div className="flex items-center gap-3 relative">
                <span className="text-2xl w-8 text-center">{MEDALS[i] || `#${i + 1}`}</span>
                <div>
                  <p className={`font-display font-bold ${RANK_COLORS[i] || 'text-text'}`}>
                    {player.nickname}
                    {player.id === myId && <span className="text-ghost text-xs ml-1">(you)</span>}
                  </p>
                  {player.isHost && <p className="text-ghost text-[10px]">host</p>}
                </div>
              </div>
              <div className="text-right relative">
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className={`font-display font-extrabold text-2xl ${RANK_COLORS[i] || 'text-text'}`}>
                  {player.score}
                </motion.p>
                <p className="text-ghost text-xs">votes</p>
              </div>
            </motion.div>
          ) : null)}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <motion.div
        animate={{ opacity: revealed >= sorted.length ? 1 : 0, y: revealed >= sorted.length ? 0 : 16 }}
        transition={{ duration: 0.4 }}
        className="mt-6 space-y-3 pb-8"
      >
        {isHost && (
          <button onClick={playAgain}
            className="relative w-full py-4 rounded-2xl bg-neon text-white font-display font-bold text-lg glow-purple overflow-hidden btn-glow transition-all active:scale-95">
            Play Again 🔄
          </button>
        )}
        <button onClick={leaveRoom}
          className="w-full py-3 rounded-2xl bg-card border border-border text-ghost text-sm transition-all active:scale-95 hover:border-rose/50 hover:text-rose">
          Leave Room
        </button>
      </motion.div>
    </div>
  )
}
