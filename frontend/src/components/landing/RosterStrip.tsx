import { motion } from 'framer-motion'

const people = [
  { name: 'AN', status: 'in' },
  { name: 'DC', status: 'in' },
  { name: 'PM', status: 'late' },
  { name: 'RJ', status: 'in' },
  { name: 'SK', status: 'off' },
  { name: 'TW', status: 'in' },
  { name: 'LO', status: 'in' },
  { name: 'MB', status: 'late' },
  { name: 'YZ', status: 'in' },
  { name: 'HK', status: 'off' },
] as const

const statusColor: Record<string, string> = {
  in: '#3FAE7A',
  late: '#D99A3D',
  off: '#5B7B9A',
}

export function RosterStrip() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {people.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.4 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-ink-800 text-xs font-medium text-paper-100 ring-2 ring-ink-950"
        >
          {p.name}
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-ink-950"
            style={{ backgroundColor: statusColor[p.status] }}
          />
          {p.status === 'in' && (
            <motion.span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
              style={{ backgroundColor: statusColor[p.status] }}
              animate={{ scale: [1, 1.9, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.15 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}
