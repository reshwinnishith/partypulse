'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { castVote, subscribeVotes, updateRoom } from '@/lib/db'
import type { Room, Player, Question, Vote } from '@/lib/firebase'

type Props = {
  room: Room; players: Player[]; questions: Question[]
  myId: string; code: string
}

export default function GameView({ room, players, questions, myId, code }: Props) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [myVote, setMyVote] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  const currentQ = questions[room.currentQuestion]
  const totalQ = questions.length
  const qNum = room.currentQuestion + 1
  const isHost = players.find(p => p.id === myId)?.isHost || false

  // Reset on question change
  useEffect(() => {
    setMyVote(null)
    setShowResults(false)
    setVotes([])
    setAdvancing(false)
  }, [room.currentQuestion])

  // Subscribe to votes for current question
  useEffect(() => {
    if (!currentQ) return
    return subscribeVotes(code, room.currentQuestion, newVotes => {
      setVotes(newVotes)
      // Find my vote
      const mine = newVotes.find(v => v.voterId === myId)
      if (mine) setMyVote(mine.votedForId)
    })
  }, [code, room.currentQuestion, currentQ, myId])

  // Auto-reveal when everyone has voted
  useEffect(() => {
    if (votes.length >= players.length && players.length >= 2) {
      const t = setTimeout(() => setShowResults(true), 700)
      return () => clearTimeout(t)
    }
  }, [votes.length, players.length])

  const voteCounts = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v.votedForId] = (acc[v.votedForId] || 0) + 1
    return acc
  }, {})
  const maxVotes = Math.max(...Object.values(voteCounts), 1)

  async function handleVote(targetId: string) {
    if (targetId === myId || myVote || submitting || !currentQ) return
    setSubmitting(true)
    setMyVote(targetId)
    await castVote(code, room.currentQuestion, myId, targetId)
    setSubmitting(false)
  }

  async function handleNext() {
    if (!isHost || advancing) return
    setAdvancing(true)
    if (room.currentQuestion + 1 >= totalQ) {
      await updateRoom(code, { status: 'results' })
    } else {
      await updateRoom(code, { currentQuestion: room.currentQuestion + 1 })
    }
  }

  if (!currentQ) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ghost">Loading questions...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-4 mb-6">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalQ }).map((_, i) => (
            <motion.div key={i}
              animate={{ width: i < qNum ? 24 : 12 }}
              className={`h-1.5 rounded-full transition-colors duration-500 ${i < qNum ? 'bg-neon' : 'bg-border'}`}
            />
          ))}
        </div>
        <span className="text-ghost text-xs">{qNum} / {totalQ}</span>
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={currentQ.id}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-br from-neon/20 to-ember/10 border border-neon/30 rounded-2xl p-6 mb-6"
        >
          <p className="text-ghost text-xs uppercase tracking-widest mb-3">Who is most likely to...</p>
          <h2 className="font-display text-2xl font-bold text-bright leading-snug">{currentQ.text}</h2>
        </motion.div>
      </AnimatePresence>

      {/* Voting or Round Results */}
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div key="voting" className="flex-1 space-y-3">
            <p className="text-ghost text-xs uppercase tracking-widest mb-2">
              {myVote
                ? `Voted ✓  —  ${votes.length} / ${players.length} players voted`
                : "Tap to vote · can't vote for yourself"}
            </p>

            {players.map((player, i) => {
              const isSelf = player.id === myId
              const isChosen = myVote === player.id
              const hasVoted = !!myVote

              return (
                <motion.button key={player.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.055 }}
                  onClick={() => handleVote(player.id)}
                  disabled={isSelf || hasVoted}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all active:scale-[0.97] ${
                    isSelf ? 'bg-card border-border opacity-35 cursor-not-allowed'
                    : isChosen ? 'bg-neon/20 border-neon glow-purple'
                    : hasVoted ? 'bg-card border-border opacity-50 cursor-default'
                    : 'bg-card border-border hover:border-neon/40 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm ${isChosen ? 'bg-neon text-white' : 'bg-surface text-ghost'}`}>
                      {player.nickname[0].toUpperCase()}
                    </div>
                    <span className="text-text text-sm">
                      {player.nickname}
                      {isSelf && <span className="text-ghost text-xs ml-1">(you)</span>}
                    </span>
                  </div>
                  {isChosen && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-neon text-xl">✓</motion.span>
                  )}
                </motion.button>
              )
            })}

            {myVote && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-ghost text-sm pt-2 flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-ghost/30 border-t-ghost rounded-full animate-spin inline-block" />
                Waiting for everyone...
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div key="round-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-3">
            <p className="text-ghost text-xs uppercase tracking-widest mb-2">Round Results</p>

            {[...players].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)).map((player, i) => {
              const count = voteCounts[player.id] || 0
              const pct = (count / maxVotes) * 100

              return (
                <motion.div key={player.id}
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.09 }}
                  className="relative bg-card border border-border rounded-2xl p-4 overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.09 + 0.2, duration: 0.55, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-neon/10 rounded-2xl"
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {i === 0 && count > 0 && (
                        <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.5, type: 'spring' }} className="text-xl">🏆</motion.span>
                      )}
                      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center font-bold text-ghost text-sm">
                        {player.nickname[0].toUpperCase()}
                      </div>
                      <span className="text-text text-sm">{player.nickname}</span>
                    </div>
                    <span className={`font-display font-bold text-xl ${count > 0 ? 'text-glow' : 'text-muted'}`}>
                      {count} {count === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                </motion.div>
              )
            })}

            {isHost ? (
              <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                onClick={handleNext} disabled={advancing}
                className="relative w-full py-4 mt-2 rounded-2xl bg-ember text-white font-display font-bold text-lg glow-ember overflow-hidden btn-glow transition-all active:scale-95 disabled:opacity-60">
                {advancing
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </span>
                  : room.currentQuestion + 1 >= totalQ ? 'See Final Results 🎊' : 'Next Question →'
                }
              </motion.button>
            ) : (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="text-center text-ghost text-sm py-3">
                Waiting for host to continue...
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
