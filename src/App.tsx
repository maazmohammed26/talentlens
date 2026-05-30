import axios from 'axios'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CloudUpload,
  Database,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Gauge,
  Home,
  Layers3,
  LogOut,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Rocket,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/mock-api',
})

type Candidate = {
  id: string
  name: string
  email: string
  rank: number
  finalScore: number
  semanticScore: number
  skillScore: number
  experienceScore: number
  behaviorScore: number
  activityScore: number
  experienceYears: number
  skills: string[]
  matchedSkills: string[]
  missingSkills: string[]
  status: string
  reason: string
  projects: string
  education: string
  platformActivity: string
  resumeText: string
}

type Job = {
  id: string
  title: string
  department: string
  location: string
  type: string
  level: string
  description: string
  requiredSkills: string
  preferredSkills: string
}

type RoleProfile = {
  title: string
  requiredSkills: string[]
  preferredSkills: string[]
  keywords: string[]
  minimumYears: number
  responsibilities: string[]
  sourceText: string
}

const storageKeys = {
  candidates: 'talentlens:v2:candidates',
  jobs: 'talentlens:v2:jobs',
  applications: 'talentlens:v2:applications',
  activeJobId: 'talentlens:v2:active-job-id',
  jdText: 'talentlens:v2:jd-text',
  companySession: 'talentlens:v2:company-session',
  candidateSession: 'talentlens:v2:candidate-session',
}

const demoAccounts = {
  company: {
    email: 'company@talentlens.ai',
    password: 'Company@123',
  },
  candidate: {
    email: 'candidate@talentlens.ai',
    password: 'Candidate@123',
  },
}

const defaultSkills = ['SQL', 'Python', 'Power BI', 'Excel', 'Dashboarding', 'Analytics']
const knownSkills = [
  'SQL',
  'Python',
  'Power BI',
  'Excel',
  'Tableau',
  'Looker',
  'Dashboarding',
  'Analytics',
  'Data Visualization',
  'Machine Learning',
  'Statistics',
  'Stakeholder Reporting',
  'ETL',
  'BigQuery',
  'Snowflake',
  'React',
  'Node.js',
  'FastAPI',
  'TypeScript',
  'AWS',
  'Azure',
]

const sampleCandidateCsv =
  'candidate_id,name,email,skills,experience,projects,education,platform_activity,resume_text\n' +
  'C101,Ayesha Khan,ayesha@example.com,"SQL; Python; Power BI; Excel","4 years","Revenue dashboard; churn analysis","B.Tech Computer Science","14 analytics challenges","Built BI dashboards and automated KPI reporting"\n' +
  'C204,Rahul Sharma,rahul@example.com,"Python; SQL; Data Visualization","3 years","Customer segmentation; sales dashboard","M.Sc Data Analytics","Active weekly","Created analytics notebooks and dashboards"'

const sampleRankedOutputCsv =
  'candidate_id,name,rank,final_score,skill_score,experience_score,semantic_score,reason\n' +
  'C101,Ayesha Khan,1,92,88,90,95,"Strong SQL, Power BI, analytics project experience and high role relevance"\n' +
  'C204,Rahul Sharma,2,87,85,82,91,"Good Python and dashboarding experience with relevant project background"'

const pricingPlans = [
  {
    name: 'Starter',
    price: 'INR 4,999',
    period: '/month',
    description: 'For small teams ranking a few active roles every month.',
    features: ['3 active jobs', '1,000 candidate rows', 'CSV and JSON export', 'Email support'],
    featured: false,
  },
  {
    name: 'Growth',
    price: 'INR 14,999',
    period: '/month',
    description: 'For growing recruiting teams that need explainable shortlists.',
    features: ['15 active jobs', '10,000 candidate rows', 'AI explanations', 'Shortlist collaboration'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'INR 49,999',
    period: '/month',
    description: 'For high-volume hiring with custom workflows and compliance.',
    features: ['Unlimited jobs', 'Custom ATS integration', 'Dedicated success manager', 'Private AI deployment options'],
    featured: false,
  },
]

const dashboardTrend = [
  { name: 'Mon', candidates: 8, jobs: 1 },
  { name: 'Tue', candidates: 22, jobs: 1 },
  { name: 'Wed', candidates: 35, jobs: 2 },
  { name: 'Thu', candidates: 48, jobs: 2 },
  { name: 'Fri', candidates: 64, jobs: 3 },
]

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function isLoggedIn(role: 'company' | 'candidate') {
  return localStorage.getItem(role === 'company' ? storageKeys.companySession : storageKeys.candidateSession) === 'true'
}

function setLoggedIn(role: 'company' | 'candidate') {
  localStorage.setItem(role === 'company' ? storageKeys.companySession : storageKeys.candidateSession, 'true')
}

function logout(role: 'company' | 'candidate') {
  localStorage.removeItem(role === 'company' ? storageKeys.companySession : storageKeys.candidateSession)
}

function fieldKey(field: string) {
  return field.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function loadCandidates() {
  return safeJson<Candidate[]>(localStorage.getItem(storageKeys.candidates), [])
}

function saveCandidates(candidates: Candidate[]) {
  localStorage.setItem(storageKeys.candidates, JSON.stringify(candidates))
  window.dispatchEvent(new Event(storageKeys.candidates))
}

function loadJobs() {
  return safeJson<Job[]>(localStorage.getItem(storageKeys.jobs), [])
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem(storageKeys.jobs, JSON.stringify(jobs))
  window.dispatchEvent(new Event(storageKeys.jobs))
}

function getActiveJob() {
  const jobs = loadJobs()
  const activeJobId = localStorage.getItem(storageKeys.activeJobId)
  return jobs.find((job) => job.id === activeJobId) || jobs[0]
}

function normalizeText(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ')
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function inferSkills(text = '') {
  const normalized = normalizeText(text)
  return knownSkills.filter((skill) => normalized.includes(skill.toLowerCase()))
}

function tokenize(value = '') {
  const stopWords = new Set([
    'and',
    'the',
    'for',
    'with',
    'from',
    'that',
    'this',
    'you',
    'your',
    'are',
    'will',
    'our',
    'role',
    'job',
    'work',
    'team',
    'candidate',
    'experience',
  ])
  return normalizeText(value)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
}

function keywordSet(value = '') {
  return unique(tokenize(value)).slice(0, 45)
}

function getYears(value = '') {
  const matches = value.match(/\d+(\.\d+)?/g)
  if (!matches) return 0
  return Math.max(...matches.map(Number))
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getRoleProfile(job = getActiveJob()): RoleProfile {
  const jdText = localStorage.getItem(storageKeys.jdText) || ''
  const sourceText = [job?.title, job?.description, job?.requiredSkills, job?.preferredSkills, jdText].filter(Boolean).join(' ')
  const required = unique([...splitSkills(job?.requiredSkills || ''), ...inferSkills(sourceText)])
  const preferred = unique(splitSkills(job?.preferredSkills || ''))
  return {
    title: job?.title || sourceText.match(/(analyst|engineer|developer|manager|designer|recruiter)/i)?.[0] || 'Uploaded role',
    requiredSkills: required.length ? required : defaultSkills,
    preferredSkills: preferred,
    keywords: keywordSet(sourceText),
    minimumYears: getYears([job?.level, job?.description, jdText].filter(Boolean).join(' ')),
    responsibilities: sourceText
      .split(/[.\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 35)
      .slice(0, 4),
    sourceText,
  }
}

function useStoredCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadCandidates())
  useEffect(() => {
    const sync = () => setCandidates(loadCandidates())
    window.addEventListener(storageKeys.candidates, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(storageKeys.candidates, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return candidates
}

function useStoredJobs() {
  const [jobs, setJobs] = useState<Job[]>(() => loadJobs())
  useEffect(() => {
    const sync = () => setJobs(loadJobs())
    window.addEventListener(storageKeys.jobs, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(storageKeys.jobs, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return jobs
}

function downloadFile(filename: string, text: string, type = 'text/csv') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(current.trim())
      current = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(current.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }

  row.push(current.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function splitSkills(value = '') {
  return value
    .split(/[;,|]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

function scoreCandidate(row: Record<string, string>, index: number, role = getRoleProfile()): Candidate {
  const skills = splitSkills(row.skills || row.skill || row.matched_skills)
  const experienceText = row.experience || row.years_experience || ''
  const years = Number((experienceText.match(/\d+(\.\d+)?/) || ['0'])[0])
  const candidateEvidence = [skills.join(' '), row.experience, row.projects, row.education, row.platform_activity, row.resume_text].filter(Boolean).join(' ')
  const evidenceTokens = new Set(tokenize(candidateEvidence))
  const matchedSkills = unique(skills.filter((skill) =>
    role.requiredSkills.some((required) => required.toLowerCase() === skill.toLowerCase()),
  ))
  const preferredMatches = unique(skills.filter((skill) =>
    role.preferredSkills.some((preferred) => preferred.toLowerCase() === skill.toLowerCase()),
  ))
  const missingSkills = role.requiredSkills.filter(
    (required) => !skills.some((skill) => skill.toLowerCase() === required.toLowerCase()),
  )
  const keywordHits = role.keywords.filter((keyword) => evidenceTokens.has(keyword) || normalizeText(candidateEvidence).includes(keyword))
  const skillScore = clampScore((matchedSkills.length / Math.max(1, role.requiredSkills.length)) * 82 + Math.min(12, preferredMatches.length * 4) + Math.min(6, skills.length))
  const experienceScore = role.minimumYears
    ? clampScore(55 + Math.min(40, (years / Math.max(1, role.minimumYears)) * 40))
    : clampScore(62 + Math.min(30, years * 7))
  const semanticScore = clampScore(48 + (keywordHits.length / Math.max(1, role.keywords.length)) * 42 + Math.min(10, matchedSkills.length * 2))
  const behaviorSignals = normalizeText(row.platform_activity || '')
  const behaviorScore = clampScore(
    55 +
      (behaviorSignals.includes('challenge') ? 12 : 0) +
      (behaviorSignals.includes('active') || behaviorSignals.includes('weekly') ? 10 : 0) +
      (behaviorSignals.includes('verified') ? 8 : 0) +
      Math.min(15, behaviorSignals.length / 12),
  )
  const activityScore = clampScore(row.platform_activity ? 68 + Math.min(27, row.platform_activity.length / 7) : 45)
  const finalScore = Math.round(
    semanticScore * 0.4 + skillScore * 0.25 + experienceScore * 0.2 + behaviorScore * 0.1 + activityScore * 0.05,
  )
  const explanationParts = [
    matchedSkills.length ? `matches required skills: ${matchedSkills.join(', ')}` : 'has limited required-skill overlap',
    keywordHits.length ? `shows semantic evidence for ${keywordHits.slice(0, 6).join(', ')}` : 'has limited semantic overlap in the uploaded text',
    years ? `includes about ${years} years of experience` : 'does not clearly state years of experience',
  ]

  return {
    id: row.candidate_id || row.id || `C${String(index + 1).padStart(3, '0')}`,
    name: row.name || row.full_name || `Candidate ${index + 1}`,
    email: row.email || row.work_email || 'not-provided@example.com',
    rank: index + 1,
    finalScore,
    semanticScore: Math.round(semanticScore),
    skillScore: Math.round(skillScore),
    experienceScore: Math.round(experienceScore),
    behaviorScore: Math.round(behaviorScore),
    activityScore: Math.round(activityScore),
    experienceYears: years,
    skills,
    matchedSkills,
    missingSkills,
    status: finalScore >= 85 ? 'Shortlisted' : finalScore >= 72 ? 'Under Review' : 'Needs Review',
    reason: `This candidate scored ${finalScore}/100 for ${role.title} because the uploaded data ${explanationParts.join(', ')}. Formula: 40% semantic, 25% skills, 20% experience, 10% behavior, 5% activity.`,
    projects: row.projects || 'No projects provided in uploaded file.',
    education: row.education || 'No education provided in uploaded file.',
    platformActivity: row.platform_activity || 'No platform activity provided in uploaded file.',
    resumeText: row.resume_text || '',
  }
}

async function parseCandidateFile(file: File) {
  const text = await file.text()
  const extension = file.name.split('.').pop()?.toLowerCase()
  const parsedRows = parseCsv(text)
  const headers = parsedRows[0] || []
  const role = getRoleProfile()
  const rows =
    extension === 'json'
      ? normalizeJsonRows(text)
      : parsedRows.slice(1).map((cells) => {
          return Object.fromEntries(headers.map((header, cellIndex) => [header.trim().toLowerCase(), cells[cellIndex] || '']))
        })

  return rows
    .map((row, index) => scoreCandidate(row, index, role))
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }))
}

function normalizeJsonRows(text: string) {
  const parsed = JSON.parse(text) as unknown
  const rows = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed && 'candidates' in parsed && Array.isArray((parsed as { candidates: unknown }).candidates)
      ? ((parsed as { candidates: unknown[] }).candidates)
      : []
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row as Record<string, unknown>).map(([key, value]) => [key.toLowerCase(), String(value ?? '')]),
    ),
  )
}

function candidateCsv(candidates: Candidate[]) {
  return (
    'candidate_id,name,rank,final_score,skill_score,experience_score,semantic_score,reason\n' +
    candidates
      .map(
        (candidate) =>
          `${candidate.id},${candidate.name},${candidate.rank},${candidate.finalScore},${candidate.skillScore},${candidate.experienceScore},${candidate.semanticScore},"${candidate.reason.replace(/"/g, '""')}"`,
      )
      .join('\n')
  )
}

function candidateToRow(candidate: Candidate): Record<string, string> {
  return {
    candidate_id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    skills: candidate.skills?.join('; ') || candidate.matchedSkills.join('; '),
    experience: `${candidate.experienceYears || 0} years`,
    projects: candidate.projects,
    education: candidate.education,
    platform_activity: candidate.platformActivity,
    resume_text: candidate.resumeText,
  }
}

function normalizeApiCandidates(value: unknown, fallback: Candidate[]) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'object' && value && 'candidates' in value && Array.isArray((value as { candidates: unknown }).candidates)
      ? (value as { candidates: unknown[] }).candidates
      : []
  if (!raw.length) return fallback
  return raw
    .map((item, index) => ({ ...fallback[index], ...(item as Partial<Candidate>), rank: index + 1 }))
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }))
}

async function runRankingEngine(candidates: Candidate[]) {
  const roleProfile = getRoleProfile()
  const localRanked = candidates
    .map((candidate, index) => scoreCandidate(candidateToRow(candidate), index, roleProfile))
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }))

  if (import.meta.env.VITE_API_URL) {
    try {
      const response = await api.post('/rank', { roleProfile, candidates: localRanked })
      return normalizeApiCandidates(response.data, localRanked)
    } catch {
      return localRanked
    }
  }

  return localRanked
}

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
      {children}
    </motion.div>
  )
}

function NeumorphicButton({
  children,
  to,
  onClick,
  variant = 'primary',
  type = 'button',
  className,
  disabled = false,
}: {
  children: ReactNode
  to?: string
  onClick?: () => void
  variant?: 'primary' | 'soft' | 'ghost'
  type?: 'button' | 'submit'
  className?: string
  disabled?: boolean
}) {
  const classes = cx(
    'neo-button inline-flex items-center justify-center gap-2 rounded-[24px] px-5 py-3 text-sm font-bold transition',
    variant === 'primary' && 'bg-primary text-white',
    variant === 'soft' && 'bg-bg text-text',
    variant === 'ghost' && 'bg-transparent text-text shadow-none',
    disabled && 'pointer-events-none opacity-50',
    className,
  )
  if (to) {
    return to.startsWith('#') ? (
      <a className={classes} href={to}>
        {children}
      </a>
    ) : (
      <Link className={classes} to={to}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

function Navbar() {
  const links = [
    ['Features', '/features'],
    ['Data', '/data'],
    ['Workflow', '/workflow'],
    ['Pricing', '/pricing'],
    ['Demo', '/demo'],
  ]
  return (
    <header className="premium-nav sticky top-0 z-30">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="logo-pill flex items-center gap-3 rounded-[24px] px-4 py-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-black tracking-tight text-text">TalentLens AI</span>
        </Link>
        <div className="hidden items-center gap-7 lg:flex">
          {links.map(([label, path]) => (
            <Link className="nav-link" key={path} to={path}>
              {label}
            </Link>
          ))}
          <Link className="nav-link" to="/company/dashboard">
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <NeumorphicButton to="/company/login" variant="soft" className="px-4 py-2 text-[13px]">
            Login
          </NeumorphicButton>
          <NeumorphicButton to="/candidate/apply" className="px-4 py-2 text-[13px]">
            Apply
          </NeumorphicButton>
        </div>
      </nav>
    </header>
  )
}

function Sidebar({ role }: { role: 'company' | 'candidate' }) {
  const companyLinks = [
    ['Dashboard', '/company/dashboard', Home],
    ['Create Job', '/company/create-job', BriefcaseBusiness],
    ['Upload JD', '/company/upload-jd', FileText],
    ['Upload Candidates', '/company/upload-candidates', Upload],
    ['AI Ranking', '/company/ranking', BarChart3],
    ['Settings', '/company/dashboard', Settings],
    ['Logout', '/', LogOut],
  ] as const
  const candidateLinks = [
    ['Dashboard', '/candidate/dashboard', Home],
    ['Browse Jobs', '/candidate/apply', Search],
    ['My Applications', '/candidate/tracking', ClipboardCheck],
    ['Profile', '/candidate/dashboard', Users],
    ['Resume', '/candidate/dashboard', FileText],
    ['Settings', '/candidate/dashboard', Settings],
    ['Logout', '/', LogOut],
  ] as const
  const links = role === 'company' ? companyLinks : candidateLinks
  return (
    <aside className="hidden w-72 shrink-0 bg-bg p-5 lg:block">
      <Link to="/" className="logo-pill mb-8 flex items-center gap-3 rounded-[24px] px-4 py-3">
        <Target className="h-5 w-5 text-primary" />
        <span className="font-black">TalentLens AI</span>
      </Link>
      <div className="space-y-2">
        {links.map(([label, path, Icon]) => (
          <NavLink
            key={label}
            to={path}
            onClick={() => {
              if (label === 'Logout') logout(role)
            }}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-bold text-muted transition',
                isActive && 'bg-bg text-primary neo-inset',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}

function Shell({ role, children }: { role: 'company' | 'candidate'; children: ReactNode }) {
  const mobileLinks =
    role === 'company'
      ? [
          ['Dashboard', '/company/dashboard'],
          ['Jobs', '/company/create-job'],
          ['Upload', '/company/upload-candidates'],
          ['Ranking', '/company/ranking'],
        ]
      : [
          ['Dashboard', '/candidate/dashboard'],
          ['Apply', '/candidate/apply'],
          ['Tracking', '/candidate/tracking'],
          ['Home', '/'],
        ]
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar role={role} />
      <main className="content-area flex-1 p-4 sm:p-5 md:p-8">
        <div className="mb-5 rounded-[24px] bg-bg p-3 neo-shadow lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2 font-black">
              <Target className="h-5 w-5 text-primary" />
              TalentLens
            </Link>
            <div className="content-area flex max-w-[68vw] gap-2 overflow-x-auto">
              {mobileLinks.map(([label, path]) => (
                <Link className="shrink-0 rounded-[20px] bg-bg px-3 py-2 text-xs font-bold text-muted neo-inset" key={label} to={path}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

function DashboardCard({ title, value, icon: Icon, tone = 'primary' }: { title: string; value: string; icon: typeof Activity; tone?: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="premium-card rounded-[24px] bg-bg p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{title}</span>
        <span className={cx('grid h-11 w-11 place-items-center rounded-full neo-inset', tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-primary')}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 text-3xl font-black">{value}</div>
    </motion.div>
  )
}

function AuthCard({ type }: { type: 'company-login' | 'company-signup' | 'candidate-login' | 'candidate-signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isCompany = type.includes('company')
  const isSignup = type.includes('signup')
  const [error, setError] = useState('')
  const invitedJobId = new URLSearchParams(location.search).get('job')
  const demo = isCompany ? demoAccounts.company : demoAccounts.candidate
  const fields = isCompany
    ? isSignup
      ? ['Company name', 'Recruiter name', 'Work email', 'Password', 'Confirm password']
      : ['Work email', 'Password']
    : isSignup
      ? ['Full name', 'Email', 'Phone', 'Password', 'Confirm password']
      : ['Email', 'Password']
  return (
    <PageTransition>
      <div className="grid min-h-screen place-items-center bg-bg p-5">
        <div className="w-full max-w-5xl rounded-[32px] bg-bg p-5 neo-shadow md:grid md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div className="rounded-[24px] bg-bg p-8 neo-inset">
            <Link to="/" className="mb-12 flex items-center gap-3">
              <Target className="h-7 w-7 text-primary" />
              <span className="text-xl font-black">TalentLens AI</span>
            </Link>
            <div className="space-y-5">
              {['Verify workspace', 'Create secure profile', 'Start AI hiring flow'].map((step, index) => (
                <div className="flex items-center gap-4" key={step}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-bg text-sm font-black neo-shadow">{index + 1}</span>
                  <span className="font-bold">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <form
            className="p-4 md:p-8"
            onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              const email = String(form.get(isCompany ? 'work_email' : 'email') || '')
              const password = String(form.get('password') || '')
              if (!isSignup && (email !== demo.email || password !== demo.password)) {
                setError(`Use demo credentials: ${demo.email} / ${demo.password}`)
                return
              }
              setError('')
              if (!isCompany) {
                setLoggedIn('candidate')
              } else {
                setLoggedIn('company')
              }
              navigate(isCompany ? '/company/dashboard' : invitedJobId ? `/candidate/apply/${invitedJobId}` : '/candidate/dashboard')
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{isCompany ? 'Company access' : 'Candidate access'}</p>
            <h1 className="mt-3 text-3xl font-black">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
            {!isSignup && (
              <div className="mt-5 rounded-[20px] bg-bg p-4 text-sm font-bold text-muted neo-inset">
                <div className="font-black text-text">Demo credentials</div>
                <div className="mt-2">Email: <span className="text-primary">{demo.email}</span></div>
                <div>Password: <span className="text-primary">{demo.password}</span></div>
              </div>
            )}
            <div className="mt-8 space-y-4">
              {fields.map((field) => (
                <label key={field} className="block">
                  <span className="form-label">{field}</span>
                  <input
                    className="neo-input"
                    name={fieldKey(field)}
                    type={field.toLowerCase().includes('password') ? 'password' : field.toLowerCase().includes('email') ? 'email' : 'text'}
                    placeholder={field}
                    defaultValue={!isSignup && (field === 'Work email' || field === 'Email') ? demo.email : !isSignup && field === 'Password' ? demo.password : ''}
                  />
                </label>
              ))}
            </div>
            {error && <div className="mt-5 rounded-[20px] bg-warning/10 p-4 text-sm font-bold text-warning">{error}</div>}
            <NeumorphicButton type="submit" className="mt-7 w-full">
              {isSignup ? 'Create account' : 'Login'} <ArrowRight className="h-4 w-4" />
            </NeumorphicButton>
            <p className="mt-5 text-center text-sm text-muted">
              {isSignup ? 'Already registered?' : 'New here?'}{' '}
              <Link
                className="font-black text-primary"
                to={
                  isCompany
                    ? (isSignup ? '/company/login' : '/company/signup')
                    : `${isSignup ? '/candidate/login' : '/candidate/signup'}${invitedJobId ? `?job=${invitedJobId}` : ''}`
                }
              >
                {isSignup ? 'Login' : 'Create account'}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </PageTransition>
  )
}

function FileUploadBox({
  title,
  accept,
  onFile,
  note = 'Drag a file here or browse from your computer',
  format = 'CSV',
}: {
  title: string
  accept: string
  onFile?: (file: File) => void
  note?: string
  format?: string
}) {
  return (
    <label className="group grid cursor-pointer gap-5 rounded-[24px] bg-bg p-5 neo-shadow transition sm:grid-cols-[9rem_1fr] sm:items-center sm:p-6">
      <span className="mx-auto grid h-28 w-28 place-items-center rounded-[22px] bg-bg text-center neo-inset sm:mx-0">
        <span>
          <CloudUpload className="mx-auto h-8 w-8 text-primary" />
          <span className="mt-2 block text-sm font-black text-muted">{format}</span>
        </span>
      </span>
      <span className="rounded-[22px] bg-bg p-6 text-center neo-inset">
        <span className="block text-lg font-black">{title}</span>
        <span className="mt-2 block text-sm leading-6 text-muted">{note}</span>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-bg px-3 py-1 text-xs font-black text-primary neo-shadow">
          <Upload className="h-3.5 w-3.5" /> Browse file
        </span>
      </span>
      <input
        className="hidden"
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onFile?.(file)
        }}
      />
    </label>
  )
}

function ScoreBadge({ score }: { score: number }) {
  return <span className={cx('rounded-full px-3 py-1 text-xs font-black', score >= 85 ? 'bg-success/10 text-success' : score >= 72 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>{score}</span>
}

function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  if (candidates.length === 0) {
    return <EmptyState title="No uploaded candidates yet" copy="Upload a CSV or JSON candidate dataset to populate this table." action="/company/upload-candidates" actionLabel="Upload candidates" />
  }
  return (
    <div className="overflow-hidden rounded-[24px] bg-bg neo-shadow">
      <div className="content-area overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-bg text-xs uppercase text-muted">
            <tr>
              {['Rank', 'Candidate Name', 'Final Score', 'Semantic', 'Skill', 'Experience', 'Behavioral', 'Status', 'Details'].map((h) => (
                <th className="px-4 py-4" key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr className="border-t border-[#d8d7e2]" key={candidate.id}>
                <td className="px-4 py-4 font-black">#{candidate.rank}</td>
                <td className="px-4 py-4">
                  <div className="font-black">{candidate.name}</div>
                  <div className="text-xs text-muted">{candidate.email}</div>
                </td>
                <td className="px-4 py-4"><ScoreBadge score={candidate.finalScore} /></td>
                <td className="px-4 py-4">{candidate.semanticScore}</td>
                <td className="px-4 py-4">{candidate.skillScore}</td>
                <td className="px-4 py-4">{candidate.experienceScore}</td>
                <td className="px-4 py-4">{candidate.behaviorScore}</td>
                <td className="px-4 py-4"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{candidate.status}</span></td>
                <td className="px-4 py-4">
                  <Link className="inline-flex items-center gap-1 font-black text-primary" to={`/company/candidates/${candidate.id}`}>
                    Open <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProgressStepper({ active = 6 }: { active?: number }) {
  const steps = [
    ['JD', 'Job Description Upload', FileText],
    ['Data', 'Candidate Dataset Upload', Database],
    ['Prep', 'Preprocessing', SlidersHorizontal],
    ['Embed', 'Embedding Generation', Layers3],
    ['Score', 'Hybrid Scoring', Gauge],
    ['Rank', 'Ranked Shortlist', Award],
    ['Export', 'CSV Export', FileSpreadsheet],
  ] as const
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-bg p-5 neo-shadow">
      <div className="content-area relative flex gap-4 overflow-x-auto pb-1">
        <div className="absolute left-6 right-6 top-10 hidden border-t border-dotted border-primary md:block" />
        {steps.map(([tag, label, Icon], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cx('relative min-w-[160px] rounded-[22px] p-4 text-center transition', index <= active ? 'bg-primary text-white' : 'bg-bg text-text neo-shadow')}
          >
            <Icon className="mx-auto h-6 w-6" />
            <span className={cx('mt-3 inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]', index <= active ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary')}>{tag}</span>
            <div className="mt-3 text-xs font-black leading-5">{label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function LoadingRankingAnimation() {
  return (
    <div className="flex items-center gap-3 rounded-[24px] bg-bg p-5 neo-shadow">
      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }} className="grid h-12 w-12 place-items-center rounded-full text-primary neo-inset">
        <Target className="h-5 w-5" />
      </motion.span>
      <div>
        <div className="font-black">Ranking uploaded candidates</div>
        <div className="text-sm text-muted">Semantic 40%, skills 25%, experience 20%, behavior 10%, activity 5%</div>
      </div>
    </div>
  )
}

function LandingPage() {
  const candidates = useStoredCandidates()
  const heroCandidates = candidates.slice(0, 2)
  return (
    <MarketingFrame>
      <section className="mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-12">
        <div>
          <p className="inset-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
            <ShieldCheck className="h-4 w-4" /> AI hiring intelligence
          </p>
          <h1 className="hero-title mt-6 max-w-3xl font-black text-text">
            Rank candidates by real fit, not just keywords.
          </h1>
          <p className="mt-6 max-w-[480px] text-[15px] leading-8 text-muted">
            TalentLens AI helps recruiters understand skills, experience, behavior, and role relevance to build a shortlist they can trust.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <NeumorphicButton to="/company/login">
              Company Login <ArrowRight className="h-4 w-4" />
            </NeumorphicButton>
            <NeumorphicButton to="/candidate/apply" variant="soft">
              Candidate Apply
            </NeumorphicButton>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <MetricPill label="Shortlist lift" value="38%" icon={TrendingUp} />
            <MetricPill label="Uploaded rows" value={String(candidates.length)} icon={Users} />
            <MetricPill label="Setup time" value="12 min" icon={Clock} />
          </div>
        </div>
        <HeroProductMockup candidates={heroCandidates} />
      </section>
    </MarketingFrame>
  )
}

function MarketingFrame({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="h-screen overflow-hidden bg-bg">
        <Navbar />
        <main className="content-area h-[calc(100vh-80px)]">
          {children}
          <MarketingFooter />
        </main>
      </div>
    </PageTransition>
  )
}

function MarketingFooter() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[#d8d7e2] px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
      <span>TalentLens AI / AI-assisted ranking for recruiter judgment.</span>
      <div className="flex flex-wrap gap-4 font-bold text-text">
        <Link className="hover:text-primary" to="/company/signup">Company Signup</Link>
        <Link className="hover:text-primary" to="/candidate/signup">Candidate Signup</Link>
      </div>
    </footer>
  )
}

function MetricPill({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return (
    <div className="rounded-[22px] bg-bg p-4 neo-shadow">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 text-xl font-black">{value}</div>
      <div className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">{label}</div>
    </div>
  )
}

function HeroProductMockup({ candidates }: { candidates: Candidate[] }) {
  const hasCandidates = candidates.length > 0
  return (
    <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="rounded-[24px] bg-bg p-4 neo-shadow sm:p-5">
      <div className="rounded-[22px] bg-bg p-4 neo-inset sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-muted">Shortlist confidence</p>
            <h2 className="text-5xl font-black text-text">{hasCandidates ? `${candidates[0].finalScore}%` : '0%'}</h2>
          </div>
          <span className="rounded-full bg-success/10 px-4 py-2 text-sm font-black text-success">{hasCandidates ? 'Ranking ready' : 'Awaiting upload'}</span>
        </div>
        <div className="mt-6 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardTrend}>
              <CartesianGrid stroke="#d8d7e2" strokeDasharray="4 4" />
              <XAxis dataKey="name" />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="candidates" stroke="#534AB7" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {hasCandidates ? (
            candidates.map((candidate) => (
              <div className="rounded-[20px] bg-bg p-4 neo-shadow" key={candidate.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black">{candidate.name}</span>
                  <ScoreBadge score={candidate.finalScore} />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{candidate.reason}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[20px] bg-bg p-5 text-center text-sm font-bold text-muted neo-shadow sm:col-span-2">
              Upload a candidate CSV to replace this empty state with real candidate previews.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function FeaturesPage() {
  const features = [
    [FileText, 'Job Description Understanding', 'Extract role intent, responsibilities, skills, domain signals, and seniority.'],
    [Target, 'Semantic Candidate Matching', 'Compare meaning and role relevance instead of relying on keywords alone.'],
    [Gauge, 'Skill & Experience Scoring', 'Balance hard skills, experience depth, and evidence from projects.'],
    [Activity, 'Behavioral Signal Analysis', 'Use platform activity and structured screening signals as ranking context.'],
    [Award, 'AI Shortlist Generation', 'Generate recruiter-friendly explanations and a ranked shortlist.'],
    [FileSpreadsheet, 'Ranked CSV Export', 'Download results in CSV or JSON for ATS workflows and reporting.'],
  ] as const
  return (
    <MarketingFrame>
      <MarketingPageHeader eyebrow="Features" title="Premium hiring intelligence, built for real recruiter workflows" copy="Upload, validate, rank, explain, shortlist, export, and collaborate without turning hiring into a spreadsheet maze." />
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {features.map(([Icon, title, copy]) => (
            <motion.div whileHover={{ y: -4 }} className="feature-card rounded-[20px] bg-bg p-5 sm:p-7" key={title}>
              <span className="grid h-10 w-10 place-items-center rounded-full text-primary neo-inset">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-[15px] font-bold text-text">{title}</h3>
              <p className="mt-3 text-[13px] leading-[1.6] text-muted">{copy}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </MarketingFrame>
  )
}

function DataPage() {
  return (
    <MarketingFrame>
      <MarketingPageHeader eyebrow="Data" title="What data is used and where it goes" copy="Candidate ranking uses your JD and candidate dataset. Ranked CSV, JSON, or PDF reports are outputs created after scoring." />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[24px] bg-bg p-6 neo-shadow">
          <h2 className="text-2xl font-black">Input format</h2>
          <div className="mt-5 space-y-4">
            {[
              ['Job Description', 'Paste text or upload PDF/DOCX. The AI extracts skills, seniority, responsibilities, soft skills, and domain signals.'],
              ['Candidate Dataset', 'Upload CSV/JSON with candidate_id, name, email, skills, experience, projects, education, platform_activity, and resume_text.'],
              ['Ranked Output', 'Generated after scoring. Download CSV/JSON from the ranking page or attach a PDF report for archive.'],
            ].map(([title, copy]) => (
              <div className="rounded-[22px] bg-bg p-4 neo-inset" key={title}>
                <h3 className="font-black text-text">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <NeumorphicButton variant="soft" onClick={() => downloadFile('talentlens-sample-candidates.csv', sampleCandidateCsv)}>
              <Download className="h-4 w-4" /> Download sample CSV
            </NeumorphicButton>
            <NeumorphicButton variant="soft" onClick={() => downloadFile('talentlens-example-ranked-output.csv', sampleRankedOutputCsv)}>
              <FileSpreadsheet className="h-4 w-4" /> Download output example
            </NeumorphicButton>
            <NeumorphicButton to="/company/upload-candidates">
              Upload candidate data
            </NeumorphicButton>
          </div>
        </div>
        <div className="rounded-[24px] bg-bg p-6 neo-shadow">
          <h2 className="text-2xl font-black">Ranked output report</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This matches the PDF-style block you showed. It is for an already generated ranked report, not for the original candidate dataset.
          </p>
          <div className="mt-5">
            <FileUploadBox title="Drop ranked PDF report or browse" accept=".pdf" format="PDF" note="Supports PDF reports up to 5 MB." />
          </div>
        </div>
      </section>
    </MarketingFrame>
  )
}

function WorkflowPage() {
  return (
    <MarketingFrame>
      <MarketingPageHeader eyebrow="Workflow" title="From JD to shortlist in one guided flow" copy="Each stage is visible, explainable, and ready to connect to your backend ranking service." />
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <ProgressStepper />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {[
            ['Upload inputs', 'Start with a JD and candidate CSV/JSON.'],
            ['Score candidates', 'Semantic, skill, experience, behavior, and activity signals are combined.'],
            ['Export shortlist', 'Recruiters download ranked CSV/JSON or open detailed candidate profiles.'],
          ].map(([title, copy]) => (
            <div className="rounded-[24px] bg-bg p-6 neo-shadow" key={title}>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingFrame>
  )
}

function PricingPage() {
  return (
    <MarketingFrame>
      <MarketingPageHeader eyebrow="Pricing" title="Simple INR plans for Indian hiring teams" copy="Use the UI now with local CSV uploads, then connect billing and backend APIs when ready." />
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <motion.div whileHover={{ y: -4 }} className={cx('rounded-[24px] p-6 transition', plan.featured ? 'bg-primary text-white neo-shadow' : 'bg-bg text-text neo-shadow')} key={plan.name}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-black">{plan.name}</h3>
                {plan.featured && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">Popular</span>}
              </div>
              <p className={cx('mt-3 text-sm leading-6', plan.featured ? 'text-white/80' : 'text-muted')}>{plan.description}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={cx('pb-1 text-sm font-bold', plan.featured ? 'text-white/70' : 'text-muted')}>{plan.period}</span>
              </div>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div className="flex items-center gap-3 text-sm font-semibold" key={feature}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
              <NeumorphicButton to="/company/signup" variant={plan.featured ? 'soft' : 'primary'} className="mt-7 w-full">
                Choose {plan.name}
              </NeumorphicButton>
            </motion.div>
          ))}
        </div>
      </section>
    </MarketingFrame>
  )
}

function DemoPage() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <MarketingFrame>
      <MarketingPageHeader eyebrow="Demo" title="See a realistic recruiter workflow" copy="Request a product walkthrough with sample ranking output, CSV export, and API integration planning." />
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid gap-6 rounded-[28px] bg-bg p-5 neo-shadow lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div className="rounded-[24px] bg-bg p-6 neo-inset">
            <h2 className="text-3xl font-black">Book a TalentLens walkthrough</h2>
            <p className="mt-4 leading-7 text-muted">
              We will show JD parsing, candidate upload, ranking, shortlist export, and where your backend/API keys plug in.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {([
                [Calendar, '30 minute walkthrough'],
                [Award, 'Sample role-fit report'],
                [Eye, 'Auditable explanations'],
                [Rocket, 'Backend API plan'],
              ] as const).map(([Icon, label]) => (
                <div className="flex items-center gap-3 rounded-[20px] bg-bg p-4 neo-shadow" key={label}>
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-black">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <form
            className="grid gap-4 rounded-[24px] bg-bg p-6 neo-shadow"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitted(true)
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="form-label">Full name</span><input className="neo-input" placeholder="Priya Mehta" /></label>
              <label><span className="form-label">Company</span><input className="neo-input" placeholder="Acme Analytics" /></label>
              <label><span className="form-label inline-flex items-center gap-2"><Mail className="h-4 w-4" />Work email</span><input className="neo-input" placeholder="priya@company.com" /></label>
              <label><span className="form-label inline-flex items-center gap-2"><Phone className="h-4 w-4" />Phone</span><input className="neo-input" placeholder="+91 98765 43210" /></label>
            </div>
            <label><span className="form-label">Monthly hiring volume</span><input className="neo-input" placeholder="Example: 20 roles, 5,000 candidates" /></label>
            <NeumorphicButton type="submit" className="mt-2">
              Request INR demo quote <ArrowRight className="h-4 w-4" />
            </NeumorphicButton>
            {submitted && (
              <div className="rounded-[20px] bg-success/10 p-4 text-sm font-bold text-success">
                Demo request saved locally. Connect this form to your CRM or backend API in production.
              </div>
            )}
          </form>
        </div>
      </section>
    </MarketingFrame>
  )
}

function MarketingPageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="inset-chip inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-text md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-8 text-muted">{copy}</p>
    </section>
  )
}

function CompanyDashboard() {
  const candidates = useStoredCandidates()
  const jobs = useStoredJobs()
  const shortlisted = candidates.filter((candidate) => candidate.status === 'Shortlisted').length
  return (
    <Shell role="company">
      <PageTransition>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle eyebrow="Company dashboard" title="Hiring workspace" copy="Create roles, upload candidate data, and rank only the candidates you import." />
          <div className="flex flex-wrap gap-3">
            <NeumorphicButton to="/company/create-job"><BriefcaseBusiness className="h-4 w-4" />Create Job</NeumorphicButton>
            <NeumorphicButton to="/company/upload-candidates" variant="soft"><Upload className="h-4 w-4" />Upload Candidates</NeumorphicButton>
            <NeumorphicButton to="/company/ranking" variant="soft"><BarChart3 className="h-4 w-4" />View Ranking</NeumorphicButton>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Total jobs" value={String(jobs.length)} icon={BriefcaseBusiness} />
          <DashboardCard title="Uploaded candidates" value={String(candidates.length)} icon={Users} />
          <DashboardCard title="Shortlisted" value={String(shortlisted)} icon={UserCheck} tone="success" />
          <DashboardCard title="Ranking status" value={candidates.length ? 'Ready' : 'Empty'} icon={Gauge} tone={candidates.length ? 'success' : 'warning'} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[24px] bg-bg p-5 neo-shadow">
            <h2 className="text-xl font-black">Hiring activity</h2>
            {candidates.length ? (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardTrend.map((item, index) => ({ ...item, candidates: Math.round((candidates.length / 5) * (index + 1)), jobs: jobs.length }))}>
                    <CartesianGrid stroke="#d8d7e2" strokeDasharray="4 4" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="candidates" stroke="#534AB7" fill="#534AB7" fillOpacity={0.08} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No hiring activity yet" copy="Upload candidates to see ranking and activity metrics." action="/company/upload-candidates" actionLabel="Upload candidates" />
            )}
          </div>
          <div className="rounded-[24px] bg-bg p-5 neo-shadow">
            <h2 className="text-xl font-black">Job posts</h2>
            <div className="mt-4 space-y-3">
              {jobs.length ? jobs.map((job) => <JobCard job={job} key={job.id} showShare />) : <EmptyState title="No jobs created" copy="Create your first role to connect JD analysis and candidate ranking." action="/company/create-job" actionLabel="Create job" compact />}
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-black">Candidate rankings</h2>
          <CandidateTable candidates={candidates} />
        </div>
      </PageTransition>
    </Shell>
  )
}

function JobCard({ job, showShare = false }: { job: Job; showShare?: boolean }) {
  const shareUrl = `${window.location.origin}/candidate/apply/${job.id}`
  return (
    <div className="rounded-[20px] bg-bg p-4 neo-inset">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black">{job.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{job.department || 'Department not set'}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location || 'Location not set'}</span>
            <span>{job.type || 'Job type not set'}</span>
          </div>
        </div>
        {showShare && (
          <button
            className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-black text-white"
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(shareUrl)
            }}
          >
            Copy apply link
          </button>
        )}
      </div>
      {showShare && <div className="mt-3 break-all rounded-[16px] bg-bg p-3 text-xs font-bold text-muted neo-shadow">{shareUrl}</div>}
    </div>
  )
}

function CreateJobPage() {
  const navigate = useNavigate()
  const fields = [
    ['title', 'Job title'],
    ['department', 'Department'],
    ['location', 'Location'],
    ['type', 'Job type'],
    ['level', 'Experience level'],
    ['requiredSkills', 'Required skills'],
    ['preferredSkills', 'Preferred skills'],
  ]
  return (
    <Shell role="company">
      <PageTransition>
        <SectionTitle eyebrow="Job setup" title="Create Job" copy="Saved jobs appear in the company dashboard and candidate application flow." />
        <form
          className="mt-8 rounded-[24px] bg-bg p-6 neo-shadow"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const job: Job = {
              id: `J${Date.now()}`,
              title: String(form.get('title') || 'Untitled role'),
              department: String(form.get('department') || ''),
              location: String(form.get('location') || ''),
              type: String(form.get('type') || ''),
              level: String(form.get('level') || ''),
              description: String(form.get('description') || ''),
              requiredSkills: String(form.get('requiredSkills') || ''),
              preferredSkills: String(form.get('preferredSkills') || ''),
            }
            saveJobs([job, ...loadJobs()])
            localStorage.setItem(storageKeys.activeJobId, job.id)
            navigate('/company/dashboard')
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            {fields.map(([name, field]) => <label key={name}><span className="form-label">{field}</span><input className="neo-input" name={name} placeholder={field} /></label>)}
          </div>
          <label className="mt-5 block"><span className="form-label">Job description</span><textarea className="neo-input min-h-32" name="description" placeholder="Describe the role, scope, and business context." /></label>
          <label className="mt-5 block"><span className="form-label">Responsibilities</span><textarea className="neo-input min-h-32" name="responsibilities" placeholder="List core responsibilities." /></label>
          <NeumorphicButton type="submit" className="mt-6"><Save className="h-4 w-4" />Save Job</NeumorphicButton>
        </form>
      </PageTransition>
    </Shell>
  )
}

function UploadJDPage() {
  const [analyzed, setAnalyzed] = useState(false)
  const [jdText, setJdText] = useState(() => localStorage.getItem(storageKeys.jdText) || '')
  return (
    <Shell role="company">
      <PageTransition>
        <SectionTitle eyebrow="Role intelligence" title="Upload Job Description" copy="Paste a JD or upload PDF/DOCX, then review the extracted role signals." />
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <label><span className="form-label">Paste job description text</span><textarea className="neo-input min-h-64" value={jdText} onChange={(event) => setJdText(event.target.value)} placeholder="Paste the full job description here." /></label>
            <div className="mt-5"><FileUploadBox title="Upload PDF or DOCX" accept=".pdf,.doc,.docx" format="JD" note="PDF/DOCX extraction can be connected to your backend parser." /></div>
            <NeumorphicButton
              className="mt-6"
              onClick={() => {
                localStorage.setItem(storageKeys.jdText, jdText)
                setAnalyzed(true)
              }}
              disabled={!jdText.trim()}
            >
              <Target className="h-4 w-4" />Analyze Job Description
            </NeumorphicButton>
          </div>
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <h2 className="text-xl font-black">Preview extracted JD</h2>
            {analyzed ? (
              <div className="mt-5 grid gap-4">
                {[
                  ['Role title', jdText.match(/analyst|engineer|manager|developer/i)?.[0] || 'Role detected from uploaded JD'],
                  ['Required skills', inferSkills(jdText).join(', ') || 'Connect backend extraction for exact skill parsing'],
                  ['Experience level', jdText.match(/\d+\+?\s*(years|yrs)/i)?.[0] || 'Not explicitly detected'],
                  ['Responsibilities', 'Generated from the pasted job description text.'],
                  ['Soft skills', 'Communication, ownership, structured problem solving'],
                  ['Domain requirements', 'Detected from JD context after backend integration'],
                ].map(([k, v]) => <InfoRow key={k} label={k} value={v} />)}
              </div>
            ) : <EmptyState title="No analysis yet" copy="Paste a job description to enable analysis." />}
          </div>
        </div>
      </PageTransition>
    </Shell>
  )
}

function UploadCandidateDatasetPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadCandidates())
  const [reportReady, setReportReady] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function handleFile(file: File) {
    setError('')
    try {
      const parsed = await parseCandidateFile(file)
      if (!parsed.length) {
        setError('No candidate rows found. Please upload a CSV/JSON file with candidate records.')
        return
      }
      saveCandidates(parsed)
      setCandidates(parsed)
    } catch {
      setError('Could not parse the file. Check the CSV/JSON format and try again.')
    }
  }
  return (
    <Shell role="company">
      <PageTransition>
        <SectionTitle eyebrow="Candidate data" title="Upload Candidate Dataset" copy="Use CSV or JSON candidate data for ranking. PDF reports are optional output attachments only." />
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] bg-bg p-5 neo-shadow sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Candidate input file</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  This is the real ranking input. Add one row per candidate with skills, experience, projects, education, platform activity, and resume text.
                </p>
              </div>
              <NeumorphicButton variant="soft" onClick={() => downloadFile('talentlens-sample-candidates.csv', sampleCandidateCsv)}>
                <Download className="h-4 w-4" /> CSV template
              </NeumorphicButton>
            </div>
            <div className="mt-6">
              <FileUploadBox title="Drop candidate CSV/JSON or browse" accept=".csv,.json" format="CSV" note="Expected fields: candidate_id, name, email, skills, experience, projects, education, platform_activity, resume_text." onFile={handleFile} />
            </div>
            {error && <div className="mt-4 rounded-[20px] bg-warning/10 p-4 text-sm font-bold text-warning">{error}</div>}
            <div className="mt-6">
              <CandidateTable candidates={candidates} />
            </div>
            <NeumorphicButton className="mt-6" onClick={() => navigate('/company/ranking')} disabled={!candidates.length}>
              <PlayCircle className="h-4 w-4" />Run AI Ranking
            </NeumorphicButton>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] bg-bg p-5 neo-shadow sm:p-6">
              <h2 className="text-2xl font-black">What is the PDF/report upload?</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                The screenshot block is for a ranked output file. It is not the candidate dataset. Use it when you already have a PDF ranking report and want to attach it to this hiring project.
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  ['Candidate CSV/JSON', 'Input data used by AI ranking'],
                  ['Ranked CSV/JSON', 'Output generated by the ranking page'],
                  ['Ranked PDF report', 'Optional archive or comparison upload'],
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between gap-3 rounded-[20px] bg-bg p-4 neo-inset" key={label}>
                    <span className="font-black">{label}</span>
                    <span className="text-right text-xs font-bold text-muted">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] bg-bg p-5 neo-shadow sm:p-6">
              <h2 className="text-2xl font-black">Ranked output report</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Optional PDF upload like your reference image. Generated CSV/JSON exports are available on the ranking page.</p>
              <div className="mt-5">
                <FileUploadBox title="Drop ranked PDF report or browse" accept=".pdf" format="PDF" note="Supports PDF reports up to 5 MB." onFile={() => setReportReady(true)} />
              </div>
              {reportReady && (
                <div className="mt-4 rounded-[20px] bg-success/10 p-4 text-sm font-bold text-success">
                  Ranked report attached to this job workspace.
                </div>
              )}
              <NeumorphicButton className="mt-5" variant="soft" onClick={() => downloadFile('talentlens-example-ranked-output.csv', sampleRankedOutputCsv)}>
                <FileSpreadsheet className="h-4 w-4" />Download output example
              </NeumorphicButton>
            </div>
          </div>
        </div>
      </PageTransition>
    </Shell>
  )
}

function RankingResultPage() {
  const candidates = useStoredCandidates()
  const [running, setRunning] = useState(false)
  const [minimumScore, setMinimumScore] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [shortlistedOnly, setShortlistedOnly] = useState(false)
  const filteredCandidates = useMemo(() => {
    const min = Number(minimumScore) || 0
    const skillTerms = splitSkills(skillFilter).map((skill) => skill.toLowerCase())
    const minYears = Number((experienceFilter.match(/\d+(\.\d+)?/) || ['0'])[0])
    return candidates.filter((candidate) => {
      const candidateYears = candidate.experienceYears || 0
      const skillMatch = !skillTerms.length || skillTerms.every((skill) => (candidate.skills || []).some((candidateSkill) => candidateSkill.toLowerCase().includes(skill)))
      return (
        candidate.finalScore >= min &&
        skillMatch &&
        (!minYears || candidateYears >= minYears) &&
        (!shortlistedOnly || candidate.status === 'Shortlisted')
      )
    })
  }, [candidates, experienceFilter, minimumScore, shortlistedOnly, skillFilter])
  const shortlisted = useMemo(() => filteredCandidates.filter((c) => c.status === 'Shortlisted'), [filteredCandidates])
  async function simulateApi() {
    if (!candidates.length) return
    setRunning(true)
    const ranked = await runRankingEngine(candidates)
    saveCandidates(ranked)
    await new Promise((resolve) => setTimeout(resolve, 450))
    setRunning(false)
  }
  return (
    <Shell role="company">
      <PageTransition>
        <SectionTitle eyebrow="AI ranking" title="Ranked Shortlist" copy="Final Score = 40% Semantic Fit + 25% Skill Match + 20% Experience Match + 10% Behavioral Signals + 5% Activity Signals." />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label><span className="form-label">Minimum score</span><input className="neo-input" placeholder="80" value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)} /></label>
          <label><span className="form-label">Skills</span><input className="neo-input" placeholder="SQL, Python" value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} /></label>
          <label><span className="form-label">Minimum experience years</span><input className="neo-input" placeholder="3" value={experienceFilter} onChange={(event) => setExperienceFilter(event.target.value)} /></label>
          <label className="flex items-end gap-3 rounded-[20px] bg-bg p-4 neo-shadow"><input type="checkbox" checked={shortlistedOnly} onChange={(event) => setShortlistedOnly(event.target.checked)} /> <span className="font-bold">Shortlisted only</span></label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <NeumorphicButton onClick={simulateApi} disabled={!candidates.length}><Target className="h-4 w-4" />Run Ranking</NeumorphicButton>
          <NeumorphicButton variant="soft" disabled={!filteredCandidates.length} onClick={() => downloadFile('talentlens-ranking.csv', candidateCsv(filteredCandidates))}><Download className="h-4 w-4" />Download CSV</NeumorphicButton>
          <NeumorphicButton variant="soft" disabled={!filteredCandidates.length} onClick={() => downloadFile('talentlens-ranking.json', JSON.stringify(filteredCandidates, null, 2), 'application/json')}><FileJson className="h-4 w-4" />Download JSON</NeumorphicButton>
          <NeumorphicButton variant="soft" disabled={!shortlisted.length} onClick={() => downloadFile('talentlens-shortlist.csv', candidateCsv(shortlisted))}><UserCheck className="h-4 w-4" />Export Shortlist</NeumorphicButton>
          <NeumorphicButton variant="soft" onClick={() => downloadFile('talentlens-example-ranked-output.csv', sampleRankedOutputCsv)}><FileSpreadsheet className="h-4 w-4" />Example Output</NeumorphicButton>
        </div>
        <div className="mt-6">{running ? <LoadingRankingAnimation /> : <ProgressStepper active={candidates.length ? 6 : 1} />}</div>
        <div className="mt-6"><CandidateTable candidates={filteredCandidates} /></div>
      </PageTransition>
    </Shell>
  )
}

function CandidateDetailPage() {
  const { id } = useParams()
  const candidates = useStoredCandidates()
  const candidate = candidates.find((c) => c.id === id)
  if (!candidate) {
    return (
      <Shell role="company">
        <EmptyState title="Candidate not found" copy="Upload a candidate dataset, then open a candidate from the ranking table." action="/company/upload-candidates" actionLabel="Upload candidates" />
      </Shell>
    )
  }
  return (
    <Shell role="company">
      <PageTransition>
        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <CandidateProfileCard candidate={candidate} />
          <div className="space-y-6">
            <div className="rounded-[24px] bg-bg p-6 neo-shadow">
              <h1 className="text-3xl font-black">{candidate.name}</h1>
              <p className="mt-2 text-muted">{candidate.email} / Rank #{candidate.rank}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <DashboardCard title="Final fit score" value={`${candidate.finalScore}`} icon={Gauge} />
                <DashboardCard title="Semantic" value={`${candidate.semanticScore}`} icon={Target} />
                <DashboardCard title="Skills" value={`${candidate.skillScore}`} icon={Layers3} />
                <DashboardCard title="Behavior" value={`${candidate.behaviorScore}`} icon={Activity} />
              </div>
            </div>
            <div className="rounded-[24px] bg-bg p-6 neo-shadow">
              <h2 className="text-xl font-black">AI explanation</h2>
              <p className="mt-3 leading-7 text-muted">{candidate.reason}</p>
            </div>
            <div className="rounded-[24px] bg-bg p-6 neo-shadow">
              <h2 className="text-xl font-black">Recruiter notes</h2>
              <textarea className="neo-input mt-4 min-h-28" placeholder="Add evaluation notes, interview feedback, or next steps." />
              <div className="mt-5 flex flex-wrap gap-3">
                <NeumorphicButton><UserCheck className="h-4 w-4" />Shortlist</NeumorphicButton>
                <NeumorphicButton variant="soft"><X className="h-4 w-4" />Reject</NeumorphicButton>
                <NeumorphicButton variant="soft"><Save className="h-4 w-4" />Save</NeumorphicButton>
                <NeumorphicButton variant="soft" onClick={() => downloadFile(`${candidate.id}-profile.json`, JSON.stringify(candidate, null, 2), 'application/json')}><Download className="h-4 w-4" />Download Profile</NeumorphicButton>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </Shell>
  )
}

function CandidateProfileCard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="rounded-[24px] bg-bg p-6 neo-shadow">
      <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-primary text-2xl font-black text-white">{candidate.name.slice(0, 2).toUpperCase()}</div>
      <h2 className="mt-5 text-2xl font-black">{candidate.name}</h2>
      <p className="text-muted">{candidate.email}</p>
      <InfoRow label="Matched skills" value={candidate.matchedSkills.join(', ') || 'No required skills matched'} />
      <InfoRow label="Missing skills" value={candidate.missingSkills.join(', ') || 'No missing required skills'} />
      <InfoRow label="Experience summary" value={candidate.reason} />
      <InfoRow label="Projects" value={candidate.projects} />
      <InfoRow label="Education" value={candidate.education} />
      <InfoRow label="Platform activity" value={candidate.platformActivity} />
    </div>
  )
}

function CandidateDashboard() {
  const applications = safeJson<string[]>(localStorage.getItem(storageKeys.applications), [])
  return (
    <Shell role="candidate">
      <PageTransition>
        <SectionTitle eyebrow="Candidate dashboard" title="Your application hub" copy="Manage profile completion, resume uploads, and applications created through this local app." />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Profile completion" value="0%" icon={UserCheck} tone="warning" />
          <DashboardCard title="Applications" value={String(applications.length)} icon={ClipboardCheck} />
          <DashboardCard title="Saved jobs" value="0" icon={Bookmark} tone="warning" />
          <DashboardCard title="Current status" value={applications.length ? 'Applied' : 'Empty'} icon={Activity} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <h2 className="text-xl font-black">Resume upload</h2>
            <div className="mt-5"><FileUploadBox title="Upload latest resume" accept=".pdf,.doc,.docx" format="CV" note="Resume storage can be connected to your backend." /></div>
          </div>
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <h2 className="text-xl font-black">Shared job access</h2>
            <div className="mt-5">
              <EmptyState title="No shared job selected" copy="Candidates can apply only from a company-provided apply link. Shared links look like /candidate/apply/J123." compact />
            </div>
          </div>
        </div>
      </PageTransition>
    </Shell>
  )
}

function CandidateApplicationPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const jobs = useStoredJobs()
  const [step, setStep] = useState(0)
  const [selectedJob, setSelectedJob] = useState(jobId || '')
  const steps = ['Select Job', 'Personal Details', 'Upload Resume', 'Add Skills', 'Screening Questions', 'Review Application', 'Submit Application']
  const invitedJob = jobs.find((job) => job.id === jobId)
  const isCandidateSignedIn = localStorage.getItem(storageKeys.candidateSession) === 'true'
  useEffect(() => {
    if (jobId && invitedJob && !isCandidateSignedIn) {
      navigate(`/candidate/signup?job=${jobId}`, { replace: true })
    }
  }, [invitedJob, isCandidateSignedIn, jobId, navigate])
  function submitApplication() {
    const list = safeJson<string[]>(localStorage.getItem(storageKeys.applications), [])
    localStorage.setItem(storageKeys.applications, JSON.stringify([invitedJob?.title || selectedJob || 'Shared job application', ...list]))
  }
  if (!jobId) {
    return (
      <Shell role="candidate">
        <EmptyState title="Apply link required" copy="Candidates can apply only from a company-shared job URL. Ask the company for their specific apply link." />
      </Shell>
    )
  }
  if (!invitedJob) {
    return (
      <Shell role="candidate">
        <EmptyState title="Job link not found" copy="This apply link does not match a saved company job in this local workspace." action="/company/create-job" actionLabel="Create company job" />
      </Shell>
    )
  }
  if (!isCandidateSignedIn) {
    return (
      <Shell role="candidate">
        <EmptyState title="Redirecting to candidate signup" copy="Create a candidate account first, then this exact shared job will reopen automatically." />
      </Shell>
    )
  }
  return (
    <Shell role="candidate">
      <PageTransition>
        <SectionTitle eyebrow="Application flow" title="Apply for a role" copy="A Workday-style guided flow for clean candidate submission." />
        <ApplicationStepper steps={steps} active={step} />
        <div className="mt-8 rounded-[24px] bg-bg p-6 neo-shadow">
          <h2 className="text-2xl font-black">{steps[step]}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {step === 0 && <button className={cx('text-left rounded-[20px] outline outline-2 outline-primary')} type="button" onClick={() => setSelectedJob(invitedJob.id)}><JobCard job={invitedJob} /></button>}
            {step === 1 && ['Full name', 'Email', 'Phone', 'Location'].map((f) => <label key={f}><span className="form-label">{f}</span><input className="neo-input" placeholder={f} /></label>)}
            {step === 2 && <div className="md:col-span-2"><FileUploadBox title="Upload resume" accept=".pdf,.doc,.docx" format="CV" /></div>}
            {step === 3 && getRoleProfile(invitedJob).requiredSkills.map((skill) => <label className="flex items-center gap-3 rounded-[20px] bg-bg p-4 neo-inset" key={skill}><input type="checkbox" />{skill}</label>)}
            {step === 4 && ['Are you authorized to work?', 'Can you join within 30 days?', 'Describe a dashboard or project you built.'].map((q) => <label className="md:col-span-2" key={q}><span className="form-label">{q}</span><textarea className="neo-input min-h-20" /></label>)}
            {step === 5 && <EmptyState title="Review application" copy="Your details, resume, skills, and screening answers are ready for submission." />}
            {step === 6 && <EmptyState title="Application submitted" copy="Status: Applied. Recruiters can now review your profile." />}
          </div>
          <div className="mt-6 flex justify-between">
            <NeumorphicButton variant="soft" onClick={() => setStep(Math.max(0, step - 1))}>Back</NeumorphicButton>
            <NeumorphicButton
              disabled={step === 0 && !selectedJob}
              onClick={() => {
                if (step === steps.length - 2) submitApplication()
                setStep(Math.min(steps.length - 1, step + 1))
              }}
            >
              {step === steps.length - 2 ? 'Submit Application' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </NeumorphicButton>
          </div>
        </div>
      </PageTransition>
    </Shell>
  )
}

function ApplicationTrackingPage() {
  const applications = safeJson<string[]>(localStorage.getItem(storageKeys.applications), [])
  const statuses = applications.length ? ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Rejected', 'Selected'] : []
  return (
    <Shell role="candidate">
      <PageTransition>
        <SectionTitle eyebrow="Tracking" title="Application Tracking" copy="Monitor each application status from submission through selection." />
        {statuses.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statuses.map((status, index) => (
              <motion.div whileHover={{ y: -4 }} className="rounded-[24px] bg-bg p-6 neo-shadow" key={status}>
                <span className="grid h-12 w-12 place-items-center rounded-full text-primary neo-inset">{index + 1}</span>
                <h2 className="mt-5 text-xl font-black">{status}</h2>
                <p className="mt-2 text-sm text-muted">{applications[0]} / Updated locally</p>
              </motion.div>
            ))}
          </div>
        ) : <div className="mt-8"><EmptyState title="No applications yet" copy="Submit an application to start tracking status." action="/candidate/apply" actionLabel="Apply now" /></div>}
      </PageTransition>
    </Shell>
  )
}

function ApplicationStepper({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="mt-8 rounded-[24px] bg-bg p-4 neo-shadow">
      <div className="content-area flex gap-3 overflow-x-auto">
        {steps.map((step, index) => <button className={cx('min-w-[130px] rounded-[20px] p-3 text-xs font-black', index === active ? 'bg-primary text-white' : index < active ? 'bg-success/10 text-success' : 'bg-bg text-muted neo-inset')} key={step}>{step}</button>)}
      </div>
    </div>
  )
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-muted">{copy}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5 rounded-[20px] bg-bg p-4 neo-inset">
      <div className="text-xs font-black uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-2 text-sm font-semibold leading-6">{value}</div>
    </div>
  )
}

function EmptyState({ title, copy, action, actionLabel, compact = false }: { title: string; copy: string; action?: string; actionLabel?: string; compact?: boolean }) {
  return (
    <div className={cx('rounded-[24px] bg-bg text-center neo-inset', compact ? 'p-5' : 'p-8 md:col-span-2')}>
      <Database className="mx-auto h-10 w-10 text-primary" />
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{copy}</p>
      {action && actionLabel && (
        <NeumorphicButton to={action} className="mt-5">
          {actionLabel}
        </NeumorphicButton>
      )}
    </div>
  )
}

function ProtectedRoute({ role, children }: { role: 'company' | 'candidate'; children: ReactNode }) {
  const location = useLocation()
  if (!isLoggedIn(role)) {
    return <Navigate to={`/${role}/login`} replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/data" element={<DataPage />} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/company/login" element={<AuthCard type="company-login" />} />
      <Route path="/company/signup" element={<AuthCard type="company-signup" />} />
      <Route path="/candidate/login" element={<AuthCard type="candidate-login" />} />
      <Route path="/candidate/signup" element={<AuthCard type="candidate-signup" />} />
      <Route path="/company/dashboard" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/candidate/dashboard" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
      <Route path="/company/create-job" element={<ProtectedRoute role="company"><CreateJobPage /></ProtectedRoute>} />
      <Route path="/company/upload-jd" element={<ProtectedRoute role="company"><UploadJDPage /></ProtectedRoute>} />
      <Route path="/company/upload-candidates" element={<ProtectedRoute role="company"><UploadCandidateDatasetPage /></ProtectedRoute>} />
      <Route path="/company/ranking" element={<ProtectedRoute role="company"><RankingResultPage /></ProtectedRoute>} />
      <Route path="/company/candidates/:id" element={<ProtectedRoute role="company"><CandidateDetailPage /></ProtectedRoute>} />
      <Route path="/candidate/apply" element={<CandidateApplicationPage />} />
      <Route path="/candidate/apply/:jobId" element={<CandidateApplicationPage />} />
      <Route path="/candidate/tracking" element={<ProtectedRoute role="candidate"><ApplicationTrackingPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
