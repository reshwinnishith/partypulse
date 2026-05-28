'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updatePlayer, deletePlayer, sendChatMessage, updateRoom } from '@/lib/db'
import type { Room, Player, ChatMessage } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

type Props = {
  room: Room; players: Player[]; myId: string
  isHost: boolean; chat: ChatMessage[]; code: string
}

export default function LobbyView({ room, players, myId, isHost, chat, code }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [starting, setStarting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const me = players.find(p => p.id === myId)

  const nonHostPlayers = players.filter(p => !p.isHost)
  const allReady = nonHostPlayers.length >= 1 && nonHostPlayers.every(p => p.isReady)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  async function toggleReady() {
    if (!me || me.isHost) return
    await updatePlayer(code, myId, { isReady: !me.isReady })
  }

  async function sendMessage() {
    if (!message.trim() || !me) return
    const text = message.trim()
    setMessage('')
    await sendChatMessage(code, myId, me.nickname, text)
  }

  async function startGame() {
    if (!isHost || !allReady || starting) return
    setStarting(true)
    await updateRoom(code, { status: 'playing', currentQuestion: 0 })
  }

  async function leaveRoom() {
    await deletePlayer(code, myId)
    localStorage.clear()
    router.push('/')
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
  }

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-4 mb-6">
        <div>
          <p className="text-ghost text-xs uppercase tracking-widest">Room Code</p>
          <h1 className="font-display text-4xl font-extrabold text-gradient tracking-widest">{code}</h1>
        </div>
        <button onClick={leaveRoom} className="text-ghost text-sm hover:text-rose transition-colors">Leave →</button>
      </motion.div>

      {/* Share link */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        onClick={copyLink}
        className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4 w-full text-left group hover:border-neon/40 transition-colors"
      >
        <span className="text-ghost text-xs truncate max-w-[80%]">{shareUrl}</span>
        <span className="text-neon text-xs group-hover:text-glow transition-colors ml-2 shrink-0">Copy link 📋</span>
      </motion.button>

      {/* Players */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-4">
        <p className="text-ghost text-xs uppercase tracking-widest mb-3">Players ({players.length})</p>
        <div className="space-y-2">
          <AnimatePresence>
            {players.map((player, i) => (
              <motion.div key={player.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${player.isReady || player.isHost ? 'bg-mint' : 'bg-muted'}`} />
                  <span className="text-text text-sm">
                    {player.nickname}
                    {player.id === myId && <span className="text-ghost ml-1 text-xs">(you)</span>}
                  </span>
                  {player.isHost && (
                    <span className="text-[10px] bg-neon/20 text-glow border border-neon/30 rounded px-1.5 py-0.5">HOST</span>
                  )}
                </div>
                <span className={`text-xs ${player.isReady || player.isHost ? 'text-mint' : 'text-muted'}`}>
                  {player.isHost ? '👑' : player.isReady ? '✓ Ready' : 'Not ready'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Action button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4">
        {isHost ? (
          <button onClick={startGame} disabled={!allReady || starting || players.length < 2}
            className={`w-full py-4 rounded-2xl font-display font-bold text-lg transition-all active:scale-95 relative overflow-hidden ${
              allReady && players.length >= 2
                ? 'bg-ember text-white glow-ember btn-glow'
                : 'bg-card border border-border text-muted cursor-not-allowed'
            }`}>
            {starting
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </span>
              : allReady && players.length >= 2
              ? 'Start Game 🎮'
              : players.length < 2
              ? 'Waiting for players to join...'
              : `Waiting... (${nonHostPlayers.filter(p => p.isReady).length}/${nonHostPlayers.length} ready)`
            }
          </button>
        ) : (
          <button onClick={toggleReady}
            className={`w-full py-4 rounded-2xl font-display font-bold text-lg transition-all active:scale-95 relative overflow-hidden ${
              me?.isReady
                ? 'bg-card border border-mint/50 text-mint'
                : 'bg-neon text-white glow-purple btn-glow'
            }`}>
            {me?.isReady ? '✓ Ready — tap to undo' : "I'm Ready! 🙌"}
          </button>
        )}
      </motion.div>

      {/* Chat */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden"
        style={{ minHeight: 180, maxHeight: 280 }}
      >
        <div className="px-4 py-3 border-b border-border shrink-0">
          <p className="text-ghost text-xs uppercase tracking-widest">Chat</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chat.length === 0
            ? <p className="text-muted text-xs text-center py-4">Be the first to say something 👋</p>
            : chat.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm">
                <span className={`font-display font-bold text-xs mr-2 ${msg.playerId === myId ? 'text-glow' : 'text-spark'}`}>
                  {msg.nickname}
                </span>
                <span className="text-soft">{msg.message}</span>
              </motion.div>
            ))
          }
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 p-3 border-t border-border shrink-0">
          <input type="text" value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Say something..." maxLength={120}
            className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:outline-none focus:border-neon/50 transition-colors"
          />
          <button onClick={sendMessage}
            className="bg-neon text-white rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95">
            →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
