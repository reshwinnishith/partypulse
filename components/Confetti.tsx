'use client'

import { motion } from 'framer-motion'

const COLORS = ['#7c3aed','#a855f7','#f97316','#fbbf24','#10b981','#f43f5e','#ffffff','#38bdf8']

export default function Confetti() {
  const particles = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: Math.random() * 10 + 4,
    h: Math.random() * 6 + 3,
    delay: Math.random() * 1.8,
    duration: Math.random() * 2 + 2.5,
    rotate: Math.random() * 720 - 360,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id}
          initial={{ x: `${p.x}vw`, y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate, opacity: [1, 1, 0.5, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, width: p.w, height: p.h, backgroundColor: p.color, borderRadius: 2 }}
        />
      ))}
    </div>
  )
}
