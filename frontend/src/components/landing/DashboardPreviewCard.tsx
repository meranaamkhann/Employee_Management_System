import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export function DashboardPreviewCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -6, y: px * 8 })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ opacity: { duration: 0.6, delay: 0.3 }, y: { duration: 0.6, delay: 0.3 }, rotateX: { type: 'spring', stiffness: 120, damping: 15 }, rotateY: { type: 'spring', stiffness: 120, damping: 15 } }}
      style={{ transformPerspective: 1200 }}
      className="relative rounded-2xl border border-white/10 bg-ink-900/80 p-5 shadow-2xl backdrop-blur"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <p className="text-xs font-medium text-paper-300/60">Workforce overview</p>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 py-4">
        {[
          { label: 'Active', value: '482' },
          { label: 'On leave', value: '11' },
          { label: 'Open roles', value: '6' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/5 p-3">
            <p className="font-display text-xl text-paper-50">{stat.value}</p>
            <p className="text-[11px] text-paper-300/60">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1.5 pb-1 pt-2">
        {[38, 52, 44, 61, 58, 70, 66, 78].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-t bg-gradient-to-t from-brass-600 to-brass-400"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </motion.div>
  )
}
