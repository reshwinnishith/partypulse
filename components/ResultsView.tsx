'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { updateRoom, deletePlayer } from '@/lib/db'
import { getDocs, collection, query, orderBy, writeBatch, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Player, Question, Vote } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Confetti from './Confetti'

type Props = { players: Player[]; myId: string; isHost: boolean; code: string }

type QuestionResult = {
  question: Question
  topPlayers: { player: Player; votes: number }[]
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function ResultsView({ players, myId, isHost, code }: Props) {
  const router = useRouter()
  const [results, setResults] = useState<QuestionResult[]>([])
  const [revealed, setRevealed] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      const [questionsSnap, votesSnap] = await Promise.all([
        getDocs(query(collection(db, 'rooms', code, 'questions'), orderBy('orderIndex'))),
        getDocs(collection(db, 'rooms', code, 'votes')),
      ])
      const questions = questionsSnap.docs.map(d => d.data() as Question)
      const votes = votesSnap.docs.map(d => d.data() as Vote)

      const questionResults: QuestionResult[] = questions.map(q => {
        const qVotes = votes.filter(v => v.questionIndex === q.orderIndex)
        const counts: Record<string, number> = {}
        qVotes.forEach(v => { counts[v.votedForId] = (counts[v.votedForId] || 0) + 1 })
        const topPlayers = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([pid, voteCount]) => ({ player: players.find(p => p.id === pid)!, votes: voteCount }))
          .filter(x => x.player)
        return { question: q, topPlayers }
      })
      setResults(questionResults)
      setLoading(false)
    }
    fetchResults()
  }, [code, players])

  useEffect(() => {
    if (loading || results.length === 0) return
    const interval = setInterval(() => {
      setRevealed(prev => {
        if (prev >= results.length) {
          clearInterval(interval)
          setTimeout(() => setShowConfetti(true), 400)
          return prev
        }
        return prev + 1
      })
    }, 600)
    return () => clearInterval(interval)
  }, [loading, results.length])

  async function playAgain() {
    const batch = writeBatch(db)
    players.forEach(p => {
      batch.update(doc(db, 'rooms', code, 'players', p.id), { score: 0, isReady: false })
    })
    const votesSnap = await getDocs(collection(db, 'rooms', code, 'votes'))
    votesSnap.forEach(d => batch.delete(d.ref))
    const questionsSnap = await getDocs(collection(db, 'rooms', code, 'questions'))
    questionsSnap.forEach(d => batch.delete(d.ref))
    await batch.commit()
    const { createQuestions } = await import('@/lib/db')
    await createQuestions(code)
    await updateRoom(code, { status: 'lobby', currentQuestion: 0 })
  }

  async function leaveRoom() {
    await deletePlayer(code, myId)
    localStorage.clear()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ghost">Loading results...</p>
    </div>
  )

  const allRevealed = revealed >= results.length

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto relative overflow-hidden">
      {showConfetti && <Confetti />}
      <div className="absolute top-1/3 -left-20 w-60 h-60 bg-neon/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 -right-20 w-60 h-60 bg-ember/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center pt-8 mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 180 }}
          className="text-6xl mb-3 select-none">🎊</motion.div>
        <h1 className="font-display text-4xl font-extrabold text-gradient">Results</h1>
        <p className="text-ghost text-sm mt-2">Who got voted for what?</p>
      </motion.div>

      <div className="flex-1 space-y-4">
        {results.map((result, i) => i < revealed ? (
          <motion.div key={result.question.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="bg-card border border-border rounded-2xl p-4 overflow-hidden"
          >
            <p className="text-ghost text-[10px] uppercase tracking-widest mb-1">Q{i + 1}</p>
            <h3 className="font-display font-bold text-bright text-base leading-snug mb-4">{result.question.text}</h3>

            {result.topPlayers.length === 0 ? (
              <p className="text-muted text-sm">No votes</p>
            ) : (
              <div className="space-y-2">
                {result.topPlayers.map(({ player, votes }, rank) => {
                  const maxV = result.topPlayers[0].votes
                  const pct = (votes / maxV) * 100
                  return (
                    <div key={player.id} className="relative overflow-hidden rounded-xl">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.2 + rank * 0.1, duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-y-0 left-0 bg-neon/10 rounded-xl"
                      />
                      <div className="relative flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{MEDALS[rank]}</span>
                          <span className="text-text text-sm font-medium">
                            {player.nickname}
                            {player.id === myId && <span className="text-ghost text-xs ml-1">(you)</span>}
                          </span>
                        </div>
                        <span className="text-ghost text-sm font-display font-bold">
                          {votes} {votes === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : null)}
      </div>

      <motion.div
        animate={{ opacity: allRevealed ? 1 : 0, y: allRevealed ? 0 : 16 }}
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
