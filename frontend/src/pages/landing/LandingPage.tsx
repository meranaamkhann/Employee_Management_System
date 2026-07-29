import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Building2, Clock, CalendarCheck, Wallet, ShieldCheck,
  ArrowRight, Check, ChevronDown,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { RosterStrip } from '@/components/landing/RosterStrip'
import { DashboardPreviewCard } from '@/components/landing/DashboardPreviewCard'
import { useCountUp } from '@/hooks/use-count-up'
import { useAuth } from '@/lib/auth-context'
import { getDefaultRouteForRole } from '@/lib/routing'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const features = [
  { icon: Users, title: 'Employee records', desc: 'Every profile, document, and note in one searchable directory — never a spreadsheet again.' },
  { icon: Building2, title: 'Departments & hierarchy', desc: 'Org charts that reflect reality, with budgets and heads kept in sync automatically.' },
  { icon: Clock, title: 'Attendance', desc: 'Clock in, clock out, and catch late entries before they become a pattern.' },
  { icon: CalendarCheck, title: 'Leave management', desc: 'Requests, approvals, and balances — visible to the right people, invisible to everyone else.' },
  { icon: Wallet, title: 'Payroll & salary history', desc: 'Increments, bonuses, and deductions tracked with a full audit trail.' },
  { icon: ShieldCheck, title: 'Role-based access', desc: 'Admins, HR, managers, and employees each see exactly what they should.' },
]

const timeline = [
  { step: '01', title: 'Import your roster', desc: 'Bring employees in from a CSV in minutes, duplicates flagged automatically.' },
  { step: '02', title: 'Set up your org', desc: 'Departments, managers, and reporting lines — mapped once, maintained forever.' },
  { step: '03', title: 'Invite your team', desc: 'Role-based invites mean everyone gets exactly the access they need.' },
  { step: '04', title: 'Run HR from one place', desc: 'Attendance, leave, and payroll, without switching between five tools.' },
]

const testimonials = [
  { quote: 'We replaced three separate tools with Rosterly in a single sprint. Nobody misses the spreadsheets.', name: 'Priya Nair', role: 'VP of Engineering, mid-size SaaS company' },
  { quote: 'The permission model is the first one that actually matches how our org works.', name: 'Daniel Cho', role: 'Head of IT, logistics company' },
  { quote: 'Payroll history that we can actually hand to an auditor without a week of prep.', name: 'Amara Obi', role: 'HR Business Partner' },
]

const plans = [
  { name: 'Starter', price: '$4', period: '/employee/mo', features: ['Up to 50 employees', 'Core HR & attendance', 'Email support'], highlighted: false },
  { name: 'Growth', price: '$8', period: '/employee/mo', features: ['Unlimited employees', 'Leave & payroll modules', 'Role-based access', 'Priority support'], highlighted: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['SSO & audit logs', 'Dedicated success manager', 'Custom integrations'], highlighted: false },
]

const faqs = [
  { q: 'Can I migrate from a spreadsheet?', a: 'Yes — the bulk CSV import handles duplicate detection and validation, so you can bring your existing roster in without cleaning it up first.' },
  { q: 'Does it support multiple departments and managers?', a: 'Departments, managers, and reporting hierarchies are first-class concepts, with protection against circular reporting chains.' },
  { q: 'What happens to data if I delete an employee?', a: 'Deletes are soft by default — records are archived, not destroyed, and can be restored by an admin or HR user.' },
  { q: 'Is there a free trial?', a: 'Every plan starts with a 14-day trial, no card required.' },
]

export default function LandingPage() {
  return (
    <div className="bg-ink-950">
      <LandingNavbar />
      <Hero />
      <LogoStrip />
      <Features />
      <ProductPreview />
      <StatsBand />
      <Timeline />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}

function Hero() {
  const { user } = useAuth()
  const ctaHref = user ? getDefaultRouteForRole(user.role) : '/login'
  return (
    <section className="relative overflow-hidden pb-28 pt-40">
      <div className="noise absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-950 to-ink-950" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-paper-300/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
            Now with automated payroll history
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl leading-[1.1] text-paper-50 sm:text-5xl lg:text-[3.4rem]"
          >
            Employee management that feels like it was built for your team.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-lg text-lg text-paper-300/70"
          >
            Directory, attendance, leave, and payroll in one place — with permissions
            that actually understand your org chart.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              to={ctaHref}
              className="group inline-flex items-center gap-2 rounded-xl bg-brass-400 px-5 py-3 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {user ? 'Open workspace' : 'Start free trial'}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#preview" className="text-sm font-medium text-paper-300/80 hover:text-paper-50">
              See it in action →
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-14"
          >
            <p className="mb-3 text-xs uppercase tracking-wide text-paper-300/40">Who's in right now</p>
            <RosterStrip />
          </motion.div>
        </div>

        <div className="hidden lg:block">
          <DashboardPreviewCard />
        </div>
      </div>
    </section>
  )
}

function LogoStrip() {
  const names = ['Northfield', 'Cascadia', 'Ludlow & Vance', 'Fenwick Group', 'Amberline']
  return (
    <section className="border-y border-white/5 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6">
        {names.map((name) => (
          <span key={name} className="font-display text-sm text-paper-300/30">
            {name}
          </span>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        className="mx-auto max-w-xl text-center"
      >
        <h2 className="font-display text-3xl text-paper-50 sm:text-4xl">Everything HR needs. Nothing it doesn't.</h2>
        <p className="mt-4 text-paper-300/70">
          Six modules that cover the full employee lifecycle, built to work together instead of around each other.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
        className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={fadeUp}
            className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.05]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass-400/10 text-brass-400">
              <feature.icon size={19} />
            </div>
            <h3 className="mt-5 font-display text-lg text-paper-50">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-paper-300/60">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function ProductPreview() {
  return (
    <section id="preview" className="mx-auto max-w-6xl px-6 py-16">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-2"
      >
        <div className="rounded-2xl border border-white/5 bg-ink-900 p-8 sm:p-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-paper-50">A dashboard your leadership team will actually open</h2>
            <p className="mt-4 text-paper-300/70">
              Headcount, attrition, payroll totals, and department distribution — refreshed live, not exported to a deck once a quarter.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-md">
            <DashboardPreviewCard />
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function StatsBand() {
  const stats = [
    { value: 1200, suffix: '+', label: 'Companies onboarded' },
    { value: 340000, suffix: '+', label: 'Employees managed' },
    { value: 98, suffix: '%', label: 'Customer retention' },
    { value: 6, suffix: '', label: 'Hours saved per HR admin, weekly' },
  ]

  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCounter key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, value: current } = useCountUp(value)
  return (
    <div className="text-center">
      <p className="font-display text-3xl text-paper-50 sm:text-4xl">
        <span ref={ref}>{current.toLocaleString()}</span>
        {suffix}
      </p>
      <p className="mt-2 text-sm text-paper-300/60">{label}</p>
    </div>
  )
}

function Timeline() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="max-w-xl">
        <h2 className="font-display text-3xl text-paper-50 sm:text-4xl">Live in an afternoon, not a quarter</h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
        className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {timeline.map((item) => (
          <motion.div key={item.step} variants={fadeUp} className="border-t border-white/10 pt-5">
            <span className="font-mono text-xs text-brass-400">{item.step}</span>
            <h3 className="mt-3 font-display text-lg text-paper-50">{item.title}</h3>
            <p className="mt-2 text-sm text-paper-300/60">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
        className="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        {testimonials.map((t) => (
          <motion.figure key={t.name} variants={fadeUp} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <blockquote className="font-display text-base leading-relaxed text-paper-100">"{t.quote}"</blockquote>
            <figcaption className="mt-5 text-sm">
              <p className="font-medium text-paper-50">{t.name}</p>
              <p className="text-paper-300/50">{t.role}</p>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  )
}

function Pricing() {
  const { user } = useAuth()
  const ctaHref = user ? getDefaultRouteForRole(user.role) : '/login'
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-28">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl text-paper-50 sm:text-4xl">Simple, per-employee pricing</h2>
        <p className="mt-4 text-paper-300/70">No setup fees. Cancel anytime.</p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
        className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            variants={fadeUp}
            className={`rounded-2xl border p-7 ${
              plan.highlighted ? 'border-brass-400/40 bg-brass-400/[0.06]' : 'border-white/5 bg-white/[0.03]'
            }`}
          >
            <h3 className="font-display text-lg text-paper-50">{plan.name}</h3>
            <p className="mt-4">
              <span className="font-display text-3xl text-paper-50">{plan.price}</span>
              <span className="text-sm text-paper-300/60">{plan.period}</span>
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-paper-300/80">
                  <Check size={15} className="text-signal-green" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to={ctaHref}
              className={`mt-7 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-transform hover:scale-[1.02] ${
                plan.highlighted ? 'bg-brass-400 text-ink-950' : 'bg-white/10 text-paper-50'
              }`}
            >
              Get started
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-28">
      <motion.h2
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
        className="text-center font-display text-3xl text-paper-50 sm:text-4xl"
      >
        Frequently asked
      </motion.h2>

      <div className="mt-12 flex flex-col divide-y divide-white/5">
        {faqs.map((faq, i) => (
          <div key={faq.q} className="py-5">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="font-medium text-paper-50">{faq.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-paper-300/50 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="pt-3 text-sm leading-relaxed text-paper-300/60">{faq.a}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brass-400">
            <span className="font-display text-sm font-semibold text-ink-950">R</span>
          </div>
          <span className="font-display text-base text-paper-50">Rosterly</span>
        </div>
        <p className="text-sm text-paper-300/40">© {new Date().getFullYear()} Rosterly. All rights reserved.</p>
        <div className="flex gap-6 text-sm text-paper-300/50">
          <a href="#" className="hover:text-paper-50">Privacy</a>
          <a href="#" className="hover:text-paper-50">Terms</a>
          <a href="#" className="hover:text-paper-50">Contact</a>
        </div>
      </div>
    </footer>
  )
}
