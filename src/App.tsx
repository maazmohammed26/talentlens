import axios from 'axios'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bookmark,
  Brain,
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
  KeyRound,
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
  Server,
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
  softSkills: string[]
  domainRequirements: string[]
  sourceText: string
}

type SavedJD = {
  id: string
  name: string
  fileName?: string
  text: string
  createdAt: string
  profile: RoleProfile
}

type LlmSettings = {
  enabled: boolean
  provider: string
  endpoint: string
  model: string
  apiKey: string
}

type ApplicationStatus = 'Applied' | 'In Review' | 'On Hold' | 'Approved' | 'Rejected' | 'Under Review' | 'Shortlisted' | 'Interview' | 'Selected'

type ApplicationHistoryEntry = {
  status: ApplicationStatus
  hrComment: string
  updatedAt: string
}

type ApplicationRecord = {
  id: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  jobId: string
  jobTitle: string
  appliedAt: string
  lastAppliedAt: string
  currentStatus: ApplicationStatus
  hrComment: string
  history: ApplicationHistoryEntry[]
  repeatCount: number
  source: 'candidate-application' | 'manual-review'
}

type CompanyProfile = {
  companyName: string
  recruiterName: string
  email: string
}

type CandidateProfile = {
  fullName: string
  email: string
  phone: string
  location: string
}

type RankedReportOptions = {
  candidates: Candidate[]
  applications: ApplicationRecord[]
  roleProfile: RoleProfile
  companyProfile: CompanyProfile
  statusFilter: string
  filters: {
    minimumScore: string
    skills: string
    experience: string
  }
}

const storageKeys = {
  candidates: 'talentlens:v2:candidates',
  jds: 'talentlens:v2:jds',
  jobs: 'talentlens:v2:jobs',
  applications: 'talentlens:v2:applications',
  activeJobId: 'talentlens:v2:active-job-id',
  activeRoleSource: 'talentlens:v2:active-role-source',
  jdText: 'talentlens:v2:jd-text',
  llmSettings: 'talentlens:v2:llm-settings',
  companySession: 'talentlens:v2:company-session',
  candidateSession: 'talentlens:v2:candidate-session',
  companyProfile: 'talentlens:v2:company-profile',
  candidateProfile: 'talentlens:v2:candidate-profile',
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

const demoProfiles = {
  company: {
    companyName: 'TalentLens Demo Company',
    recruiterName: 'Aarav Mehta',
    email: demoAccounts.company.email,
  },
  candidate: {
    fullName: 'Riya Sharma',
    email: demoAccounts.candidate.email,
    phone: '+91 98765 43210',
    location: 'Bengaluru',
  },
} satisfies {
  company: CompanyProfile
  candidate: CandidateProfile
}

const applicationStatuses: ApplicationStatus[] = ['Applied', 'In Review', 'On Hold', 'Approved', 'Rejected', 'Under Review', 'Shortlisted', 'Interview', 'Selected']
const recruiterReviewStatuses: ApplicationStatus[] = ['Approved', 'Rejected', 'On Hold', 'In Review']

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

const defaultLlmSettings: LlmSettings = {
  enabled: false,
  provider: 'OpenAI compatible',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  apiKey: '',
}

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

function loadSessionProfile(role: 'company'): CompanyProfile
function loadSessionProfile(role: 'candidate'): CandidateProfile
function loadSessionProfile(role: 'company' | 'candidate') {
  const key = role === 'company' ? storageKeys.companyProfile : storageKeys.candidateProfile
  const fallback = role === 'company' ? demoProfiles.company : demoProfiles.candidate
  return { ...fallback, ...safeJson<Partial<CompanyProfile & CandidateProfile>>(localStorage.getItem(key), {}) }
}

function saveSessionProfile(role: 'company', profile: CompanyProfile): void
function saveSessionProfile(role: 'candidate', profile: CandidateProfile): void
function saveSessionProfile(role: 'company' | 'candidate', profile: CompanyProfile | CandidateProfile) {
  const key = role === 'company' ? storageKeys.companyProfile : storageKeys.candidateProfile
  localStorage.setItem(key, JSON.stringify(profile))
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

function candidateKey(candidate: Pick<Candidate, 'id' | 'email'>) {
  return (candidate.email || candidate.id).toLowerCase().trim()
}

function mergeCandidateDatasets(existing: Candidate[], incoming: Candidate[]) {
  const merged = new Map<string, Candidate>()
  existing.forEach((candidate) => merged.set(candidateKey(candidate), candidate))
  incoming.forEach((candidate) => {
    const key = candidateKey(candidate)
    const previous = merged.get(key)
    merged.set(key, previous ? { ...previous, ...candidate } : candidate)
  })
  return Array.from(merged.values())
    .sort((left, right) => right.finalScore - left.finalScore)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }))
}

function loadJds() {
  return safeJson<SavedJD[]>(localStorage.getItem(storageKeys.jds), [])
}

function saveJds(jds: SavedJD[]) {
  localStorage.setItem(storageKeys.jds, JSON.stringify(jds))
  window.dispatchEvent(new Event(storageKeys.jds))
}

function loadJobs() {
  return safeJson<Job[]>(localStorage.getItem(storageKeys.jobs), [])
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem(storageKeys.jobs, JSON.stringify(jobs))
  window.dispatchEvent(new Event(storageKeys.jobs))
}

function normalizeApplicationStatus(value = ''): ApplicationStatus {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'under review' || normalized === 'needs review') return 'In Review'
  if (normalized === 'selected' || normalized === 'shortlisted') return 'Approved'
  if (normalized === 'hold' || normalized === 'onhold') return 'On Hold'
  return applicationStatuses.find((status) => status.toLowerCase() === normalized) || 'Applied'
}

function sortApplicationsByRecent(applications: ApplicationRecord[]) {
  return [...applications].sort((left, right) => {
    const rightDate = Date.parse(right.lastAppliedAt || right.appliedAt || '')
    const leftDate = Date.parse(left.lastAppliedAt || left.appliedAt || '')
    return rightDate - leftDate
  })
}

function getApplicationDate(application: Partial<ApplicationRecord>, fallback = new Date().toISOString()) {
  return application.lastAppliedAt || application.appliedAt || application.history?.[0]?.updatedAt || fallback
}

function loadApplications() {
  const raw = safeJson<unknown[]>(localStorage.getItem(storageKeys.applications), [])
  if (!raw.length) return [] as ApplicationRecord[]
  if (typeof raw[0] === 'string') {
    return (raw as string[]).map<ApplicationRecord>((jobTitle, index) => ({
      id: `LEGACY-${index + 1}`,
      candidateId: 'legacy-candidate',
      candidateName: 'Imported candidate',
      candidateEmail: 'legacy@example.com',
      candidatePhone: '',
      jobId: `legacy-job-${index + 1}`,
      jobTitle,
      appliedAt: new Date().toISOString(),
      lastAppliedAt: new Date().toISOString(),
      currentStatus: 'Applied',
      hrComment: '',
      history: [{ status: 'Applied', hrComment: 'Imported from a previous local version.', updatedAt: new Date().toISOString() }],
      repeatCount: 1,
      source: 'candidate-application',
    }))
  }
  return sortApplicationsByRecent(
    (raw as Partial<ApplicationRecord>[])
      .filter((application) => application && typeof application === 'object')
      .map<ApplicationRecord>((application, index) => ({
        id: application.id || `APP-${index + 1}`,
        candidateId: application.candidateId || application.candidateEmail || `candidate-${index + 1}`,
        candidateName: application.candidateName || 'Candidate',
        candidateEmail: application.candidateEmail || '',
        candidatePhone: application.candidatePhone || '',
        jobId: application.jobId || `job-${index + 1}`,
        jobTitle: application.jobTitle || 'Untitled role',
        appliedAt: application.appliedAt || getApplicationDate(application),
        lastAppliedAt: getApplicationDate(application),
        currentStatus: normalizeApplicationStatus(application.currentStatus),
        hrComment: application.hrComment || '',
        history: Array.isArray(application.history)
          ? application.history.map<ApplicationHistoryEntry>((entry) => ({
              status: normalizeApplicationStatus(entry?.status),
              hrComment: entry?.hrComment || '',
              updatedAt: entry?.updatedAt || getApplicationDate(application),
            }))
          : [{ status: normalizeApplicationStatus(application.currentStatus), hrComment: application.hrComment || 'Imported application record.', updatedAt: getApplicationDate(application) }],
        repeatCount: Number(application.repeatCount || 1),
        source: application.source === 'manual-review' ? 'manual-review' : 'candidate-application',
      })),
  )
}

function saveApplications(applications: ApplicationRecord[]) {
  localStorage.setItem(storageKeys.applications, JSON.stringify(sortApplicationsByRecent(applications)))
  window.dispatchEvent(new Event(storageKeys.applications))
}

function loadLlmSettings() {
  return { ...defaultLlmSettings, ...safeJson<Partial<LlmSettings>>(localStorage.getItem(storageKeys.llmSettings), {}) }
}

function saveLlmSettings(settings: LlmSettings) {
  localStorage.setItem(storageKeys.llmSettings, JSON.stringify(settings))
}

function getActiveJob() {
  const jobs = loadJobs()
  const activeJobId = localStorage.getItem(storageKeys.activeJobId)
  return jobs.find((job) => job.id === activeJobId) || jobs[0]
}

function getRoleSources() {
  const jds = loadJds().map((jd) => ({
    id: `jd:${jd.id}`,
    label: `JD / ${jd.name}`,
    profile: jd.profile,
  }))
  const jobs = loadJobs().map((job) => ({
    id: `job:${job.id}`,
    label: `Job / ${job.title}`,
    profile: getRoleProfileFromJob(job),
  }))
  return [...jds, ...jobs]
}

function setActiveRoleSource(sourceId: string) {
  localStorage.setItem(storageKeys.activeRoleSource, sourceId)
  if (sourceId.startsWith('job:')) {
    localStorage.setItem(storageKeys.activeJobId, sourceId.replace('job:', ''))
  }
}

function getActiveRoleProfile() {
  const sources = getRoleSources()
  const active = localStorage.getItem(storageKeys.activeRoleSource)
  return sources.find((source) => source.id === active)?.profile || sources[0]?.profile || getRoleProfileFromJob(getActiveJob())
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

function extractSkillPhrases(text = '') {
  const sectionMatches = text.match(/(?:required skills|must have|requirements|skills|technologies|tools|preferred skills)[:\-\n]+([\s\S]{0,500})/gi) || []
  const sectionTerms = sectionMatches.flatMap((section) =>
    section
      .replace(/required skills|must have|requirements|skills|technologies|tools|preferred skills/gi, '')
      .split(/[,;|•\n]/)
      .map((term) => term.replace(/[^a-zA-Z0-9+#. ]/g, '').trim())
      .filter((term) => term.length >= 2 && term.length <= 32),
  )
  return unique([...inferSkills(text), ...sectionTerms]).slice(0, 18)
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

function extractRoleProfile(name: string, text: string): RoleProfile {
  const sourceText = text.trim()
  const required = extractSkillPhrases(sourceText)
  const preferred = unique(splitSkills((sourceText.match(/preferred skills?[:\-\n]+([^\n.]+)/i)?.[1] || ''))).filter(Boolean)
  return {
    title: name || sourceText.match(/(analyst|engineer|developer|manager|designer|recruiter|specialist|consultant)/i)?.[0] || 'Uploaded role',
    requiredSkills: required.length ? required : defaultSkills,
    preferredSkills: preferred,
    keywords: keywordSet(sourceText),
    minimumYears: getYears(sourceText),
    responsibilities: sourceText
      .split(/[.\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 35)
      .slice(0, 4),
    softSkills: unique(['communication', 'ownership', 'problem solving', 'collaboration'].filter((skill) => normalizeText(sourceText).includes(skill.replace(' ', '')) || normalizeText(sourceText).includes(skill))).slice(0, 6),
    domainRequirements: keywordSet(sourceText).filter((keyword) => !required.map((skill) => skill.toLowerCase()).includes(keyword)).slice(0, 10),
    sourceText,
  }
}

function getRoleProfileFromJob(job = getActiveJob()): RoleProfile {
  const jdText = localStorage.getItem(storageKeys.jdText) || ''
  const sourceText = [job?.title, job?.description, job?.requiredSkills, job?.preferredSkills, jdText].filter(Boolean).join(' ')
  const profile = extractRoleProfile(job?.title || 'Uploaded role', sourceText)
  return {
    ...profile,
    requiredSkills: unique([...splitSkills(job?.requiredSkills || ''), ...profile.requiredSkills]),
    preferredSkills: unique([...splitSkills(job?.preferredSkills || ''), ...profile.preferredSkills]),
    minimumYears: getYears([job?.level, job?.description, jdText].filter(Boolean).join(' ')) || profile.minimumYears,
  }
}

function getRoleProfile(job = getActiveJob()): RoleProfile {
  return job ? getRoleProfileFromJob(job) : getActiveRoleProfile()
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

function useStoredJds() {
  const [jds, setJds] = useState<SavedJD[]>(() => loadJds())
  useEffect(() => {
    const sync = () => setJds(loadJds())
    window.addEventListener(storageKeys.jds, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(storageKeys.jds, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return jds
}

function useStoredApplications() {
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => loadApplications())
  useEffect(() => {
    const sync = () => setApplications(loadApplications())
    window.addEventListener(storageKeys.applications, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(storageKeys.applications, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return applications
}

function matchCandidateToApplication(candidate: Pick<Candidate, 'id' | 'email'>, application: ApplicationRecord) {
  return (
    (!!candidate.email && !!application.candidateEmail && candidate.email.toLowerCase() === application.candidateEmail.toLowerCase()) ||
    (!!candidate.id && !!application.candidateId && candidate.id.toLowerCase() === application.candidateId.toLowerCase())
  )
}

function getCandidateApplications(candidate: Pick<Candidate, 'id' | 'email'>, applications: ApplicationRecord[]) {
  return sortApplicationsByRecent(applications.filter((application) => matchCandidateToApplication(candidate, application)))
}

function getCandidateApplicationSnapshot(candidate: Pick<Candidate, 'id' | 'email'>, applications: ApplicationRecord[]) {
  const matches = getCandidateApplications(candidate, applications)
  const current = matches[0]
  const previous = matches[1]
  return {
    matches,
    current,
    previous,
    totalApplications: matches.length,
    isRepeated: matches.length > 1,
  }
}

function formatDate(value?: string) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed)
}

function syncCandidateStatus(candidateId: string, candidateEmail: string, status: string) {
  const updated = loadCandidates().map((candidate) =>
    candidate.id === candidateId || candidate.email.toLowerCase() === candidateEmail.toLowerCase()
      ? { ...candidate, status }
      : candidate,
  )
  saveCandidates(updated)
}

function isPositiveStatus(status?: string) {
  return status === 'Approved' || status === 'Selected' || status === 'Shortlisted'
}

function isWarningStatus(status?: string) {
  return status === 'Rejected' || status === 'On Hold'
}

function isReviewLocked(application?: ApplicationRecord) {
  return !!application && recruiterReviewStatuses.includes(normalizeApplicationStatus(application.currentStatus))
}

function saveCandidateReview(candidate: Candidate, status: ApplicationStatus, hrComment: string) {
  const applications = loadApplications()
  const matches = getCandidateApplications(candidate, applications)
  const latest = matches[0]
  const now = new Date().toISOString()
  const comment = hrComment.trim()
  const historyEntry: ApplicationHistoryEntry = {
    status,
    hrComment: comment || (status === 'Rejected' ? 'Candidate marked as rejected by recruiter.' : `Candidate marked as ${status.toLowerCase()} by recruiter.`),
    updatedAt: now,
  }

  let nextApplications: ApplicationRecord[]
  if (latest) {
    nextApplications = applications.map<ApplicationRecord>((application) =>
      application.id === latest.id
        ? {
            ...application,
            currentStatus: status,
            hrComment: comment,
            history: [...application.history, historyEntry],
          }
        : application,
    )
  } else {
    const fallbackJob = getActiveJob()
    nextApplications = [
      {
        id: `APP-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        candidatePhone: '',
        jobId: fallbackJob?.id || `manual-${candidate.id}`,
        jobTitle: fallbackJob?.title || getActiveRoleProfile().title,
        appliedAt: now,
        lastAppliedAt: now,
        currentStatus: status,
        hrComment: comment,
        history: [historyEntry],
        repeatCount: 1,
        source: 'manual-review',
      } satisfies ApplicationRecord,
      ...applications,
    ]
  }

  saveApplications(nextApplications)
  syncCandidateStatus(candidate.id, candidate.email, status)
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

async function extractTextFromDocument(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
    }
    return pages.join('\n\n')
  }
  if (extension === 'docx') {
    const mammoth = await import('mammoth/mammoth.browser')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }
  return file.text()
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
  const role = getActiveRoleProfile()
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

function getDisplayStatus(candidate: Candidate, applications: ApplicationRecord[]) {
  return getCandidateApplicationSnapshot(candidate, applications).current?.currentStatus || candidate.status
}

function wrapPdfLine(value: string, maxLength = 86) {
  const words = value.replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let current = ''
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength) {
      if (current) lines.push(current)
      current = word
    } else {
      current = next
    }
  })
  if (current) lines.push(current)
  return lines
}

type PdfLine = {
  text: string
  size?: number
  bold?: boolean
  color?: string
  indent?: number
  gap?: number
  tableCells?: string[]
  tableHeader?: boolean
}

function escapePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function getPdfLineHeight(line: PdfLine) {
  if (line.tableCells) return line.tableHeader ? 22 : 46
  return line.gap ?? (line.size && line.size > 13 ? 20 : 14)
}

function buildReportPages(lines: PdfLine[]) {
  const pages: PdfLine[][] = []
  let page: PdfLine[] = []
  let y = 730
  lines.forEach((line) => {
    const gap = getPdfLineHeight(line)
    if (y - gap < 64 && page.length) {
      pages.push(page)
      page = []
      y = 730
    }
    page.push(line)
    y -= gap
  })
  if (page.length) pages.push(page)
  return pages.length ? pages : [[{ text: 'No report data available.' }]]
}

function pdfText(text: string, x: number, y: number, size = 10, font = 'F1', color = '0 0 0 rg') {
  return `BT ${color} /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`
}

function pdfRect(x: number, y: number, width: number, height: number, fill = '1 1 1 rg') {
  return `q ${fill} ${x} ${y} ${width} ${height} re f Q`
}

function pdfStrokeRect(x: number, y: number, width: number, height: number, color = '0.78 0.78 0.84 RG') {
  return `q ${color} 0.5 w ${x} ${y} ${width} ${height} re S Q`
}

function pdfStrokeLine(x1: number, y1: number, x2: number, y2: number, color = '0.78 0.78 0.84 RG') {
  return `q ${color} 0.5 w ${x1} ${y1} m ${x2} ${y2} l S Q`
}

function fitCellLines(value: string, width: number, maxLines: number) {
  const lines = wrapPdfLine(value || '-', Math.max(8, Math.floor(width / 4.4)))
  const clipped = lines.slice(0, maxLines)
  if (lines.length > maxLines && clipped.length) clipped[clipped.length - 1] = `${clipped[clipped.length - 1].slice(0, -3)}...`
  return clipped
}

function renderPdfTableRow(cells: string[], y: number, isHeader = false) {
  const x = 42
  const widths = [34, 118, 48, 74, 72, 182]
  const height = isHeader ? 22 : 46
  const commands = [
    pdfRect(x, y - height, 528, height, isHeader ? '0.17 0.14 0.45 rg' : '0.98 0.98 1 rg'),
    pdfStrokeRect(x, y - height, 528, height),
  ]
  let currentX = x
  widths.forEach((width, index) => {
    if (index > 0) commands.push(pdfStrokeLine(currentX, y, currentX, y - height))
    const textLines = fitCellLines(cells[index] || '', width - 8, isHeader ? 1 : 3)
    textLines.forEach((line, lineIndex) => {
      commands.push(pdfText(line, currentX + 4, y - 14 - lineIndex * 11, isHeader ? 8 : 7.6, isHeader ? 'F2' : 'F1', isHeader ? '1 1 1 rg' : '0.04 0.05 0.16 rg'))
    })
    currentX += width
  })
  return commands.join('\n')
}

function renderReportPage(lines: PdfLine[], pageNumber: number, totalPages: number) {
  let y = 730
  const commands = [
    'q 0.92 0.92 0.92 rg BT /F2 42 Tf 142 410 Td (TalentLens AI) Tj ET Q',
    '0.17 0.14 0.45 rg 42 756 528 1 re f',
    pdfText('TalentLens AI', 42, 764, 9, 'F2', '0.17 0.14 0.45 rg'),
    pdfText(`Page ${pageNumber} of ${totalPages}`, 500, 764, 9, 'F1', '0.35 0.35 0.35 rg'),
  ]
  lines.forEach((line) => {
    if (line.tableCells) {
      commands.push(renderPdfTableRow(line.tableCells, y, line.tableHeader))
      y -= getPdfLineHeight(line)
      return
    }
    const size = line.size ?? 10
    const font = line.bold ? 'F2' : 'F1'
    commands.push(pdfText(line.text, 42 + (line.indent ?? 0), y, size, font, line.color ?? '0.04 0.05 0.16 rg'))
    y -= getPdfLineHeight(line)
  })
  commands.push('0.17 0.14 0.45 rg 42 42 528 1 re f')
  commands.push(pdfText('Confidential recruiter report. AI assists human judgment; final hiring decisions remain with the recruiter.', 42, 28, 8, 'F1', '0.35 0.35 0.35 rg'))
  return commands.join('\n')
}

function buildPdfDocument(lines: PdfLine[]) {
  const pageLines = buildReportPages(lines)
  const pageCount = pageLines.length
  const pageObjectIds = pageLines.map((_, index) => 5 + index * 2)
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]
  pageLines.forEach((linesForPage, index) => {
    const pageObjectId = pageObjectIds[index]
    const contentObjectId = pageObjectId + 1
    const content = renderReportPage(linesForPage, index + 1, pageCount)
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`)
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  })
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

function reportStatusCounts(candidates: Candidate[], applications: ApplicationRecord[]) {
  return candidates.reduce<Record<string, number>>((counts, candidate) => {
    const status = getDisplayStatus(candidate, applications)
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {})
}

function buildRankedReportLines(options: RankedReportOptions): PdfLine[] {
  const { candidates, applications, roleProfile, companyProfile, statusFilter, filters } = options
  const generatedAt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
  const counts = reportStatusCounts(candidates, applications)
  if (!candidates.length) {
    return [
      { text: 'TalentLens AI Ranked Output Report', size: 20, bold: true, color: '0.17 0.14 0.45 rg', gap: 26 },
      { text: `JD / Role: ${roleProfile.title}`, bold: true },
      { text: `Generated: ${generatedAt}` },
      { text: 'Report type: sample PDF report' },
      { text: 'Upload candidate CSV/JSON, run ranking, apply filters, then download the live PDF from the AI Ranking page.', gap: 18 },
      { text: 'This report is designed for HR review, hiring manager sharing, client submission, and audit archive.' },
    ]
  }
  return [
    { text: 'TalentLens AI Ranked Output Report', size: 20, bold: true, color: '0.17 0.14 0.45 rg', gap: 26 },
    { text: `JD / Role: ${roleProfile.title}`, size: 12, bold: true },
    { text: `Generated: ${generatedAt}` },
    { text: `Company: ${companyProfile.companyName} | Recruiter: ${companyProfile.recruiterName}` },
    { text: `Report filter: ${statusFilter || 'All statuses'} | Minimum score: ${filters.minimumScore || 'Any'} | Skills: ${filters.skills || 'Any'} | Experience: ${filters.experience || 'Any'}`, gap: 18 },
    { text: 'Scoring method', size: 13, bold: true, color: '0.17 0.14 0.45 rg' },
    { text: 'Final Score = 40% semantic fit + 25% skill match + 20% experience match + 10% behavioral signals + 5% activity signals.', gap: 18 },
    { text: 'JD intelligence', size: 13, bold: true, color: '0.17 0.14 0.45 rg' },
    { text: `Required skills: ${roleProfile.requiredSkills.join(', ') || 'Not specified'}` },
    { text: `Preferred skills: ${roleProfile.preferredSkills.join(', ') || 'Not specified'}` },
    { text: `Experience target: ${roleProfile.minimumYears ? `${roleProfile.minimumYears}+ years` : 'Not specified'}`, gap: 18 },
    { text: 'Status summary', size: 13, bold: true, color: '0.17 0.14 0.45 rg' },
    { text: Object.entries(counts).map(([status, count]) => `${status}: ${count}`).join(' | ') || 'No statuses available', gap: 18 },
    { text: 'Candidate decision table', size: 13, bold: true, color: '0.17 0.14 0.45 rg' },
    { text: '', tableHeader: true, tableCells: ['Rank', 'Candidate', 'Score', 'Status', 'Applied', 'HR comment'] },
    ...candidates.flatMap((candidate) => {
      const application = getCandidateApplicationSnapshot(candidate, applications).current
      const status = application?.currentStatus || candidate.status
      const hrComment = application?.hrComment || 'No HR comment recorded.'
      const appliedAt = application ? formatDate(application.lastAppliedAt) : 'No application date'
      return [
        {
          text: '',
          tableCells: [
            `#${candidate.rank}`,
            `${candidate.name} | ${candidate.email}`,
            `${candidate.finalScore}/100 S:${candidate.semanticScore} K:${candidate.skillScore} E:${candidate.experienceScore}`,
            status,
            appliedAt,
            hrComment,
          ],
        },
      ] satisfies PdfLine[]
    }),
    { text: 'Candidate evidence notes', size: 13, bold: true, color: '0.17 0.14 0.45 rg', gap: 18 },
    ...candidates.flatMap((candidate) => {
      const application = getCandidateApplicationSnapshot(candidate, applications).current
      const status = application?.currentStatus || candidate.status
      return [
        { text: `#${candidate.rank} ${candidate.name} - ${status}`, bold: true, gap: 13 },
        { text: `Matched: ${candidate.matchedSkills.join(', ') || 'None'} | Missing: ${candidate.missingSkills.join(', ') || 'None'}`, indent: 10 },
        ...wrapPdfLine(`AI explanation: ${candidate.reason}`, 92).map((line) => ({ text: line, indent: 10 })),
        { text: ' ', gap: 6 },
      ] satisfies PdfLine[]
    }),
  ]
}

function downloadRankedPdf(options: RankedReportOptions, filename = 'talentlens-ranked-output-report.pdf') {
  downloadFile(filename, buildPdfDocument(buildRankedReportLines(options)), 'application/pdf')
}

function createRankedReportOptions(
  candidates: Candidate[],
  applications: ApplicationRecord[] = [],
  roleProfile = getActiveRoleProfile(),
  statusFilter = '',
  filters = { minimumScore: '', skills: '', experience: '' },
): RankedReportOptions {
  return {
    candidates,
    applications,
    roleProfile,
    companyProfile: loadSessionProfile('company'),
    statusFilter,
    filters,
  }
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

async function callLlmRanking(settings: LlmSettings, roleProfile: RoleProfile, candidates: Candidate[]) {
  if (!settings.enabled || !settings.apiKey || !settings.endpoint || !settings.model) return candidates
  const payload = {
    model: settings.model,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an AI recruiting scoring engine. Return only valid JSON with a candidates array. Preserve each candidate id. Score 0-100 using role fit, semantic relevance, skills, experience, behavior, and activity. Include concise recruiter explanations.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          output_schema: {
            candidates: [
              {
                id: 'candidate id',
                finalScore: 0,
                semanticScore: 0,
                skillScore: 0,
                experienceScore: 0,
                behaviorScore: 0,
                activityScore: 0,
                status: 'Shortlisted | Under Review | Needs Review',
                reason: 'short explanation',
              },
            ],
          },
          scoring_formula: '40% semantic, 25% skills, 20% experience, 10% behavior, 5% activity',
          roleProfile,
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            skills: candidate.skills,
            projects: candidate.projects,
            education: candidate.education,
            platformActivity: candidate.platformActivity,
            resumeText: candidate.resumeText.slice(0, 1400),
            localScores: {
              finalScore: candidate.finalScore,
              semanticScore: candidate.semanticScore,
              skillScore: candidate.skillScore,
              experienceScore: candidate.experienceScore,
              behaviorScore: candidate.behaviorScore,
              activityScore: candidate.activityScore,
            },
          })),
        }),
      },
    ],
  }
  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('LLM request failed')
  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) return candidates
  return normalizeApiCandidates(JSON.parse(content), candidates)
}

async function runRankingEngine(candidates: Candidate[]) {
  const roleProfile = getActiveRoleProfile()
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

  const llmSettings = loadLlmSettings()
  if (llmSettings.enabled && llmSettings.apiKey) {
    try {
      return await callLlmRanking(llmSettings, roleProfile, localRanked)
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
    ['Settings', '/company/settings', Settings],
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
      <div className="content-area h-screen bg-bg px-4 py-6 sm:px-5 sm:py-8">
        <div className="mx-auto flex min-h-full w-full max-w-5xl items-start justify-center md:items-center">
        <div className="w-full rounded-[32px] bg-bg p-5 neo-shadow md:grid md:grid-cols-[0.9fr_1.1fr] md:p-8">
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
              if (isCompany) {
                const companyProfile: CompanyProfile = isSignup
                  ? {
                      companyName: String(form.get('company_name') || 'TalentLens company'),
                      recruiterName: String(form.get('recruiter_name') || 'Recruiter'),
                      email,
                    }
                  : demoProfiles.company
                saveSessionProfile('company', companyProfile)
              } else {
                const candidateProfile: CandidateProfile = isSignup
                  ? {
                      fullName: String(form.get('full_name') || 'Candidate'),
                      email,
                      phone: String(form.get('phone') || ''),
                      location: '',
                    }
                  : demoProfiles.candidate
                saveSessionProfile('candidate', candidateProfile)
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

function CandidateTable({ candidates, applications = [] }: { candidates: Candidate[]; applications?: ApplicationRecord[] }) {
  if (candidates.length === 0) {
    return <EmptyState title="No uploaded candidates yet" copy="Upload a CSV or JSON candidate dataset to populate this table." action="/company/upload-candidates" actionLabel="Upload candidates" />
  }
  return (
    <div className="overflow-hidden rounded-[24px] bg-bg neo-shadow">
      <div className="content-area overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-bg text-xs uppercase text-muted">
            <tr>
              {['Rank', 'Candidate Name', 'Final Score', 'Semantic', 'Skill', 'Experience', 'Behavioral', 'Status', 'Application Trail', 'Details'].map((h) => (
                <th className="px-4 py-4" key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const application = getCandidateApplicationSnapshot(candidate, applications)
              const currentStatus = application.current?.currentStatus || candidate.status
              return (
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
                  <td className="px-4 py-4">
                    <span className={cx('rounded-full px-3 py-1 text-xs font-black', isPositiveStatus(currentStatus) ? 'bg-success/10 text-success' : isWarningStatus(currentStatus) ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                      {currentStatus}
                    </span>
                    {application.current?.hrComment && <div className="mt-2 max-w-[220px] text-xs leading-5 text-muted">{application.current.hrComment}</div>}
                  </td>
                  <td className="px-4 py-4">
                    {application.current ? (
                      <div className="max-w-[240px] space-y-2 text-xs text-muted">
                        <div className="font-bold text-text">{application.current.jobTitle}</div>
                        <div>Last applied: {formatDate(application.current.lastAppliedAt)}</div>
                        {application.isRepeated && <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 font-black text-warning">Repeated x{application.totalApplications}</span>}
                        {application.previous && <div>Previous: {application.previous.currentStatus} on {formatDate(application.previous.lastAppliedAt)}</div>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">No applications yet</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link className="inline-flex items-center gap-1 font-black text-primary" to={`/company/candidates/${candidate.id}`}>
                      Open <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
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
        <div className="mt-6 h-56 min-w-0">
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
            This PDF is a generated or attached report for sharing ranking decisions. It is different from the candidate CSV/JSON input and different from the shortlist CSV export.
          </p>
          <div className="mt-5">
            <FileUploadBox title="Attach existing ranked PDF report" accept=".pdf" format="PDF" note="Optional archive upload. Generate fresh PDF reports from the AI Ranking page." />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <NeumorphicButton variant="soft" onClick={() => downloadRankedPdf(createRankedReportOptions([]), 'talentlens-sample-ranked-output-report.pdf')}>
              <Download className="h-4 w-4" /> Download sample PDF
            </NeumorphicButton>
            <NeumorphicButton to="/company/ranking">
              Generate from ranking
            </NeumorphicButton>
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
  const applications = useStoredApplications()
  const companyProfile = loadSessionProfile('company')
  const shortlisted = applications.filter((application) => isPositiveStatus(application.currentStatus)).length || candidates.filter((candidate) => candidate.status === 'Shortlisted' || candidate.status === 'Approved').length
  const repeatedApplicants = new Set(applications.filter((application) => application.repeatCount > 1).map((application) => application.candidateEmail.toLowerCase())).size
  return (
    <Shell role="company">
      <PageTransition>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle eyebrow="Company dashboard" title={`Hiring workspace${companyProfile.recruiterName ? `, ${companyProfile.recruiterName}` : ''}`} copy="Create roles, upload candidate data, review applications, and keep recruiter comments attached to each candidate." />
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
          <DashboardCard title="Repeated applicants" value={String(repeatedApplicants)} icon={ClipboardCheck} tone={repeatedApplicants ? 'warning' : 'primary'} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[24px] bg-bg p-5 neo-shadow">
            <h2 className="text-xl font-black">Hiring activity</h2>
            {candidates.length ? (
              <div className="mt-4 h-72 min-w-0">
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
        <div className="mt-8 rounded-[24px] bg-bg p-5 neo-shadow">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Live application status</h2>
            <span className="text-sm font-bold text-muted">{applications.length} tracked applications</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {applications.length ? sortApplicationsByRecent(applications).slice(0, 6).map((application) => (
              <div className="rounded-[20px] bg-bg p-4 neo-inset" key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-black">{application.candidateName}</div>
                    <div className="mt-1 text-xs text-muted">{application.jobTitle}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cx('rounded-full px-3 py-1 text-xs font-black', isPositiveStatus(application.currentStatus) ? 'bg-success/10 text-success' : isWarningStatus(application.currentStatus) ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                      {application.currentStatus}
                    </span>
                    {application.repeatCount > 1 && <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-black text-warning">Repeated x{application.repeatCount}</span>}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                  <span>Last apply: {formatDate(application.lastAppliedAt)}</span>
                  <span>Last HR note: {application.hrComment || 'No comment yet'}</span>
                </div>
              </div>
            )) : <EmptyState title="No applications yet" copy="Candidate statuses and HR comments appear here after someone applies through a shared job link." compact />}
          </div>
        </div>
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-black">Candidate rankings</h2>
          <CandidateTable candidates={candidates} applications={applications} />
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
  const savedJds = useStoredJds()
  const [analyzed, setAnalyzed] = useState(false)
  const [jdName, setJdName] = useState('')
  const [jdText, setJdText] = useState(() => localStorage.getItem(storageKeys.jdText) || '')
  const [fileName, setFileName] = useState('')
  const [profile, setProfile] = useState<RoleProfile | null>(null)
  const [error, setError] = useState('')
  const [extracting, setExtracting] = useState(false)
  async function handleJdFile(file: File) {
    setError('')
    setExtracting(true)
    setFileName(file.name)
    try {
      const text = await extractTextFromDocument(file)
      if (!text.trim()) {
        setError('Could not extract text from this file. Try another PDF/DOCX or paste the JD text.')
      } else {
        setJdText(text)
        if (!jdName) setJdName(file.name.replace(/\.[^.]+$/, ''))
      }
    } catch {
      setError('Could not read this JD file. Try a text-based PDF/DOCX or paste the JD text.')
    }
    setExtracting(false)
  }
  function analyzeJd() {
    const extracted = extractRoleProfile(jdName || 'Saved JD', jdText)
    localStorage.setItem(storageKeys.jdText, jdText)
    setProfile(extracted)
    setAnalyzed(true)
  }
  function saveAnalyzedJd() {
    if (!profile) return
    const saved = loadJds()
    const nextName = (jdName || profile.title || 'Saved JD').trim()
    const normalizedName = nextName.toLowerCase()
    const normalizedText = normalizeText(jdText)
    const duplicate = saved.find(
      (jd) => jd.name.trim().toLowerCase() === normalizedName || normalizeText(jd.text) === normalizedText,
    )
    if (duplicate) {
      setError(`This JD is already saved as "${duplicate.name}". Select that saved JD instead of saving a duplicate.`)
      return
    }
    const jd: SavedJD = {
      id: `JD${Date.now()}`,
      name: nextName,
      fileName,
      text: jdText,
      createdAt: new Date().toISOString(),
      profile,
    }
    saveJds([jd, ...saved])
    setActiveRoleSource(`jd:${jd.id}`)
    setError('')
  }
  return (
    <Shell role="company">
      <PageTransition>
        <SectionTitle eyebrow="Role intelligence" title="Analyze and Save Job Description" copy="Name each JD, paste text or upload PDF/DOCX, analyze it, then save it as a reusable matching profile." />
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <label><span className="form-label">JD name</span><input className="neo-input" value={jdName} onChange={(event) => setJdName(event.target.value)} placeholder="Example: Senior Data Analyst JD - May 2026" /></label>
            <label className="mt-5 block"><span className="form-label">Paste job description text</span><textarea className="neo-input min-h-64" value={jdText} onChange={(event) => setJdText(event.target.value)} placeholder="Paste the full job description here." /></label>
            <div className="mt-5"><FileUploadBox title={extracting ? 'Extracting JD text...' : 'Upload PDF, DOCX, or TXT'} accept=".pdf,.docx,.txt,.md" format="JD" note="The app extracts text locally in the browser, then analyzes the JD profile." onFile={handleJdFile} /></div>
            {fileName && <div className="mt-4 rounded-[20px] bg-success/10 p-4 text-sm font-bold text-success">Loaded file: {fileName}</div>}
            {error && <div className="mt-4 rounded-[20px] bg-warning/10 p-4 text-sm font-bold text-warning">{error}</div>}
            <NeumorphicButton
              className="mt-6"
              onClick={analyzeJd}
              disabled={!jdText.trim()}
            >
              <Target className="h-4 w-4" />Analyze Job Description
            </NeumorphicButton>
            <NeumorphicButton className="mt-6 ml-0 sm:ml-3" variant="soft" onClick={saveAnalyzedJd} disabled={!profile}>
              <Save className="h-4 w-4" />Save JD Profile
            </NeumorphicButton>
          </div>
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <h2 className="text-xl font-black">Preview extracted JD</h2>
            {analyzed && profile ? (
              <div className="mt-5 grid gap-4">
                {[
                  ['Role title', profile.title],
                  ['Required skills', profile.requiredSkills.join(', ')],
                  ['Preferred skills', profile.preferredSkills.join(', ') || 'None detected'],
                  ['Experience level', profile.minimumYears ? `${profile.minimumYears}+ years` : 'Not explicitly detected'],
                  ['Responsibilities', profile.responsibilities.join(' / ') || 'No long responsibility lines detected'],
                  ['Soft skills', profile.softSkills.join(', ') || 'No soft skills explicitly detected'],
                  ['Domain requirements', profile.domainRequirements.join(', ') || 'No domain terms detected'],
                ].map(([k, v]) => <InfoRow key={k} label={k} value={v} />)}
              </div>
            ) : <EmptyState title="No analysis yet" copy="Paste a job description to enable analysis." />}
          </div>
        </div>
        <div className="mt-8 rounded-[24px] bg-bg p-6 neo-shadow">
          <h2 className="text-xl font-black">Saved JD profiles</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {savedJds.length ? savedJds.map((jd) => (
              <button className="rounded-[20px] bg-bg p-4 text-left neo-inset" key={jd.id} type="button" onClick={() => setActiveRoleSource(`jd:${jd.id}`)}>
                <div className="font-black">{jd.name}</div>
                <div className="mt-2 text-xs font-bold text-muted">{jd.profile.requiredSkills.slice(0, 5).join(', ')}</div>
              </button>
            )) : <EmptyState title="No saved JDs" copy="Analyze and save a JD to use it for candidate matching." compact />}
          </div>
        </div>
      </PageTransition>
    </Shell>
  )
}

function UploadCandidateDatasetPage() {
  const savedJds = useStoredJds()
  const jobs = useStoredJobs()
  const applications = useStoredApplications()
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadCandidates())
  const [reportReady, setReportReady] = useState(false)
  const [error, setError] = useState('')
  const roleSources = useMemo(
    () => [
      ...savedJds.map((jd) => ({ id: `jd:${jd.id}`, label: `JD / ${jd.name}` })),
      ...jobs.map((job) => ({ id: `job:${job.id}`, label: `Job / ${job.title}` })),
    ],
    [jobs, savedJds],
  )
  const [selectedSource, setSelectedSource] = useState(() => localStorage.getItem(storageKeys.activeRoleSource) || '')
  const navigate = useNavigate()
  useEffect(() => {
    if (!selectedSource && roleSources[0]) {
      setSelectedSource(roleSources[0].id)
      setActiveRoleSource(roleSources[0].id)
    }
  }, [roleSources, selectedSource])
  async function handleFile(file: File) {
    setError('')
    if (!selectedSource) {
      setError('Please create and select a saved JD or job before uploading candidate data.')
      return
    }
    setActiveRoleSource(selectedSource)
    try {
      const parsed = await parseCandidateFile(file)
      if (!parsed.length) {
        setError('No candidate rows found. Please upload a CSV/JSON file with candidate records.')
        return
      }
      const merged = mergeCandidateDatasets(loadCandidates(), parsed)
      saveCandidates(merged)
      setCandidates(merged)
    } catch {
      setError('Could not parse the file. Check the CSV/JSON format and try again.')
    }
  }
  async function rescoreCurrentCandidates() {
    if (!selectedSource || !candidates.length) return
    setActiveRoleSource(selectedSource)
    const ranked = await runRankingEngine(candidates)
    saveCandidates(ranked)
    setCandidates(ranked)
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
                  First choose the saved JD/job to match against. Then upload one row per candidate with skills, experience, projects, education, platform activity, and resume text.
                </p>
              </div>
              <NeumorphicButton variant="soft" onClick={() => downloadFile('talentlens-sample-candidates.csv', sampleCandidateCsv)}>
                <Download className="h-4 w-4" /> CSV template
              </NeumorphicButton>
            </div>
            <label className="mt-6 block">
              <span className="form-label">Choose JD / job profile for matching</span>
              <select
                className="neo-input"
                value={selectedSource}
                onChange={(event) => {
                  setSelectedSource(event.target.value)
                  setActiveRoleSource(event.target.value)
                }}
              >
                <option value="">Select a saved JD or job</option>
                {roleSources.map((source) => (
                  <option key={source.id} value={source.id}>{source.label}</option>
                ))}
              </select>
            </label>
            {!roleSources.length && (
              <div className="mt-4 rounded-[20px] bg-warning/10 p-4 text-sm font-bold text-warning">
                No JD or job profile found. Analyze and save a JD first, or create a job.
              </div>
            )}
            <div className="mt-6">
              <FileUploadBox title="Drop candidate CSV/JSON or browse" accept=".csv,.json" format="CSV" note="Expected fields: candidate_id, name, email, skills, experience, projects, education, platform_activity, resume_text." onFile={handleFile} />
            </div>
            {error && <div className="mt-4 rounded-[20px] bg-warning/10 p-4 text-sm font-bold text-warning">{error}</div>}
            <div className="mt-6">
              <CandidateTable candidates={candidates} applications={applications} />
            </div>
            <NeumorphicButton className="mt-6" onClick={() => navigate('/company/ranking')} disabled={!candidates.length}>
              <PlayCircle className="h-4 w-4" />Run AI Ranking
            </NeumorphicButton>
            <NeumorphicButton className="mt-6 ml-0 sm:ml-3" variant="soft" onClick={rescoreCurrentCandidates} disabled={!candidates.length || !selectedSource}>
              <Brain className="h-4 w-4" />Re-score with selected JD
            </NeumorphicButton>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] bg-bg p-5 neo-shadow sm:p-6">
              <h2 className="text-2xl font-black">Ranking outputs explained</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Candidate CSV/JSON is the input. Ranked results, shortlist exports, and PDF reports are outputs generated after the selected JD is matched against all uploaded candidates.
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  ['Ranked results', 'All candidates with AI scores, explanations, and statuses'],
                  ['Ranked shortlist', 'Only candidates marked Shortlisted or filtered for recruiter action'],
                  ['Ranked PDF report', 'A human-readable report for HR managers, clients, or archives'],
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between gap-3 rounded-[20px] bg-bg p-4 neo-inset" key={label}>
                    <span className="font-black">{label}</span>
                    <span className="text-right text-xs font-bold text-muted">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] bg-bg p-5 neo-shadow sm:p-6">
              <h2 className="text-2xl font-black">Attach existing PDF report</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Use this only if you already have a ranked PDF report from outside TalentLens and want to keep it with this workspace. To generate a fresh report, go to AI Ranking and click Download PDF Report.
              </p>
              <div className="mt-5">
                <FileUploadBox title="Attach ranked PDF report" accept=".pdf" format="PDF" note="Optional archive upload. This is not the candidate input file." onFile={() => setReportReady(true)} />
              </div>
              {reportReady && (
                <div className="mt-4 rounded-[20px] bg-success/10 p-4 text-sm font-bold text-success">
                  Ranked PDF report attached to this job workspace.
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <NeumorphicButton variant="soft" onClick={() => downloadRankedPdf(createRankedReportOptions([]), 'talentlens-sample-ranked-output-report.pdf')}>
                  <Download className="h-4 w-4" />Sample PDF report
                </NeumorphicButton>
                <NeumorphicButton variant="soft" onClick={() => downloadFile('talentlens-example-ranked-output.csv', sampleRankedOutputCsv)}>
                <FileSpreadsheet className="h-4 w-4" />Download output example
                </NeumorphicButton>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </Shell>
  )
}

function RankingResultPage() {
  const candidates = useStoredCandidates()
  const applications = useStoredApplications()
  const activeRole = getActiveRoleProfile()
  const [running, setRunning] = useState(false)
  const [minimumScore, setMinimumScore] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [shortlistedOnly, setShortlistedOnly] = useState(false)
  const filteredCandidates = useMemo(() => {
    const min = Number(minimumScore) || 0
    const skillTerms = splitSkills(skillFilter).map((skill) => skill.toLowerCase())
    const minYears = Number((experienceFilter.match(/\d+(\.\d+)?/) || ['0'])[0])
    return candidates.filter((candidate) => {
      const candidateYears = candidate.experienceYears || 0
      const skillMatch = !skillTerms.length || skillTerms.every((skill) => (candidate.skills || []).some((candidateSkill) => candidateSkill.toLowerCase().includes(skill)))
      const currentStatus = getDisplayStatus(candidate, applications)
      return (
        candidate.finalScore >= min &&
        skillMatch &&
        (!minYears || candidateYears >= minYears) &&
        (!statusFilter || currentStatus === statusFilter) &&
        (!shortlistedOnly || isPositiveStatus(currentStatus))
      )
    })
  }, [applications, candidates, experienceFilter, minimumScore, shortlistedOnly, skillFilter, statusFilter])
  const shortlisted = useMemo(() => filteredCandidates.filter((candidate) => isPositiveStatus(getDisplayStatus(candidate, applications))), [applications, filteredCandidates])
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
        <div className="mt-6 rounded-[24px] bg-bg p-5 neo-shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Matching against: {activeRole.title}</h2>
              <p className="mt-2 text-sm text-muted">Required: {activeRole.requiredSkills.join(', ')}</p>
            </div>
            <NeumorphicButton to="/company/upload-candidates" variant="soft">Change JD</NeumorphicButton>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            ['Ranked results', 'The full table below: every uploaded candidate scored against the selected JD.'],
            ['Ranked shortlist', 'The recruiter-ready subset: candidates whose status is Shortlisted after filters or review.'],
            ['Ranked output report', 'A PDF summary generated from the same ranked results for sharing or record keeping.'],
          ].map(([title, copy]) => (
            <div className="rounded-[20px] bg-bg p-4 neo-inset" key={title}>
              <div className="font-black">{title}</div>
              <div className="mt-2 text-sm leading-6 text-muted">{copy}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <label><span className="form-label">Minimum score</span><input className="neo-input" placeholder="80" value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)} /></label>
          <label><span className="form-label">Skills</span><input className="neo-input" placeholder="SQL, Python" value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} /></label>
          <label><span className="form-label">Minimum experience years</span><input className="neo-input" placeholder="3" value={experienceFilter} onChange={(event) => setExperienceFilter(event.target.value)} /></label>
          <label><span className="form-label">Status for report</span><select className="neo-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{['Approved', 'Rejected', 'On Hold', 'In Review', 'Needs Review', 'Applied'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <label className="flex items-end gap-3 rounded-[20px] bg-bg p-4 neo-shadow"><input type="checkbox" checked={shortlistedOnly} onChange={(event) => setShortlistedOnly(event.target.checked)} /> <span className="font-bold">Shortlisted only</span></label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <NeumorphicButton onClick={simulateApi} disabled={!candidates.length}><Target className="h-4 w-4" />Run Ranking</NeumorphicButton>
          <NeumorphicButton variant="soft" disabled={!filteredCandidates.length} onClick={() => downloadFile('talentlens-ranking.csv', candidateCsv(filteredCandidates))}><Download className="h-4 w-4" />Download CSV</NeumorphicButton>
          <NeumorphicButton variant="soft" disabled={!filteredCandidates.length} onClick={() => downloadFile('talentlens-ranking.json', JSON.stringify(filteredCandidates, null, 2), 'application/json')}><FileJson className="h-4 w-4" />Download JSON</NeumorphicButton>
          <NeumorphicButton variant="soft" disabled={!filteredCandidates.length} onClick={() => downloadRankedPdf(createRankedReportOptions(filteredCandidates, applications, activeRole, statusFilter, { minimumScore, skills: skillFilter, experience: experienceFilter }))}><FileText className="h-4 w-4" />Download PDF Report</NeumorphicButton>
          <NeumorphicButton variant="soft" disabled={!shortlisted.length} onClick={() => downloadFile('talentlens-shortlist.csv', candidateCsv(shortlisted))}><UserCheck className="h-4 w-4" />Export Shortlist</NeumorphicButton>
          <NeumorphicButton variant="soft" onClick={() => downloadFile('talentlens-example-ranked-output.csv', sampleRankedOutputCsv)}><FileSpreadsheet className="h-4 w-4" />Example Output</NeumorphicButton>
        </div>
        <div className="mt-6">{running ? <LoadingRankingAnimation /> : <ProgressStepper active={candidates.length ? 6 : 1} />}</div>
        <div className="mt-6"><CandidateTable candidates={filteredCandidates} applications={applications} /></div>
      </PageTransition>
    </Shell>
  )
}

function CandidateDetailPage() {
  const { id } = useParams()
  const candidates = useStoredCandidates()
  const applications = useStoredApplications()
  const candidate = candidates.find((c) => c.id === id)
  const [note, setNote] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const applicationSnapshot = candidate ? getCandidateApplicationSnapshot(candidate, applications) : null
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('In Review')
  const [isEditingReview, setIsEditingReview] = useState(true)
  const reviewLocked = !isEditingReview && isReviewLocked(applicationSnapshot?.current)
  useEffect(() => {
    const currentStatus = normalizeApplicationStatus(applicationSnapshot?.current?.currentStatus)
    setNote(applicationSnapshot?.current?.hrComment || '')
    setReviewStatus(recruiterReviewStatuses.includes(currentStatus) ? currentStatus : 'In Review')
    setIsEditingReview(!isReviewLocked(applicationSnapshot?.current))
  }, [applicationSnapshot?.current?.id, applicationSnapshot?.current?.hrComment, applicationSnapshot?.current?.currentStatus])
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
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] bg-bg p-4 neo-inset">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cx('rounded-full px-3 py-1 text-xs font-black', isPositiveStatus(applicationSnapshot?.current?.currentStatus) ? 'bg-success/10 text-success' : isWarningStatus(applicationSnapshot?.current?.currentStatus) ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                      {applicationSnapshot?.current?.currentStatus || candidate.status}
                    </span>
                    {applicationSnapshot?.isRepeated && <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-black text-warning">Repeated applicant x{applicationSnapshot.totalApplications}</span>}
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-muted">
                    <div>Latest role: {applicationSnapshot?.current?.jobTitle || 'Not applied through shared link yet'}</div>
                    <div>Last apply date: {formatDate(applicationSnapshot?.current?.lastAppliedAt)}</div>
                    <div>Last HR comment: {applicationSnapshot?.current?.hrComment || 'No HR comment yet'}</div>
                  </div>
                </div>
                <div className="rounded-[20px] bg-bg p-4 neo-inset">
                  <h2 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Previous application</h2>
                  {applicationSnapshot?.previous ? (
                    <div className="mt-3 space-y-2 text-sm text-muted">
                      <div>Role: {applicationSnapshot.previous.jobTitle}</div>
                      <div>Status: {applicationSnapshot.previous.currentStatus}</div>
                      <div>Applied on: {formatDate(applicationSnapshot.previous.lastAppliedAt)}</div>
                      <div>HR comment: {applicationSnapshot.previous.hrComment || 'No comment saved'}</div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted">No previous application history for this candidate yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-[24px] bg-bg p-6 neo-shadow">
              <h2 className="text-xl font-black">AI explanation</h2>
              <p className="mt-3 leading-7 text-muted">{candidate.reason}</p>
            </div>
            <div className="rounded-[24px] bg-bg p-6 neo-shadow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">Recruiter decision</h2>
                  <p className="mt-1 text-sm text-muted">Choose a status, add the HR comment, then save the review.</p>
                </div>
                {reviewLocked && (
                  <NeumorphicButton variant="soft" onClick={() => {
                    setIsEditingReview(true)
                    setSavedMessage('Review unlocked. Make changes, then save again.')
                  }}>
                    <Save className="h-4 w-4" />Edit review
                  </NeumorphicButton>
                )}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {([
                  ['Approved', UserCheck],
                  ['Rejected', X],
                  ['On Hold', Clock],
                  ['In Review', Activity],
                ] as const).map(([status, Icon]) => (
                  <NeumorphicButton
                    key={status}
                    variant={reviewStatus === status ? 'primary' : 'soft'}
                    disabled={reviewLocked}
                    onClick={() => setReviewStatus(status)}
                  >
                    <Icon className="h-4 w-4" />{status}
                  </NeumorphicButton>
                ))}
              </div>
              {reviewLocked && <div className="mt-4 rounded-[20px] bg-primary/10 p-4 text-sm font-bold text-primary">This review is locked after saving. Click Edit review to update the status or HR comment.</div>}
              <textarea disabled={reviewLocked} className="neo-input mt-4 min-h-28 disabled:opacity-60" placeholder="Add evaluation notes, interview feedback, or next steps." value={note} onChange={(event) => setNote(event.target.value)} />
              {savedMessage && <div className="mt-4 rounded-[20px] bg-success/10 p-4 text-sm font-bold text-success">{savedMessage}</div>}
              <div className="mt-5 flex flex-wrap gap-3">
                <NeumorphicButton disabled={reviewLocked} onClick={() => {
                  saveCandidateReview(candidate, reviewStatus, note)
                  setIsEditingReview(false)
                  setSavedMessage(`${reviewStatus} saved. Dashboard status, candidate tracking, and HR comment are updated.`)
                }}><Save className="h-4 w-4" />Save Review</NeumorphicButton>
                <NeumorphicButton variant="soft" onClick={() => downloadFile(`${candidate.id}-profile.json`, JSON.stringify({ ...candidate, applications: applicationSnapshot?.matches || [], recruiterComment: note }, null, 2), 'application/json')}><Download className="h-4 w-4" />Download Profile</NeumorphicButton>
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
  const profile = loadSessionProfile('candidate')
  const applications = useStoredApplications().filter((application) => application.candidateEmail.toLowerCase() === profile.email.toLowerCase())
  const latestApplication = sortApplicationsByRecent(applications)[0]
  const repeatedApplications = applications.filter((application) => application.repeatCount > 1).length
  const profileCompletion = [profile.fullName, profile.email, profile.phone, profile.location].filter(Boolean).length * 25
  return (
    <Shell role="candidate">
      <PageTransition>
        <SectionTitle eyebrow="Candidate dashboard" title={`Your application hub, ${profile.fullName}`} copy="Track only the jobs you applied to through company-shared links, along with the latest recruiter status and comments." />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Profile completion" value={`${profileCompletion}%`} icon={UserCheck} tone={profileCompletion === 100 ? 'success' : 'warning'} />
          <DashboardCard title="Applications" value={String(applications.length)} icon={ClipboardCheck} />
          <DashboardCard title="Repeated applications" value={String(repeatedApplications)} icon={Bookmark} tone={repeatedApplications ? 'warning' : 'primary'} />
          <DashboardCard title="Current status" value={latestApplication?.currentStatus || 'Empty'} icon={Activity} tone={latestApplication ? 'success' : 'warning'} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <h2 className="text-xl font-black">Resume upload</h2>
            <div className="mt-5"><FileUploadBox title="Upload latest resume" accept=".pdf,.doc,.docx" format="CV" note="Resume storage can be connected to your backend." /></div>
          </div>
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <h2 className="text-xl font-black">Latest recruiter update</h2>
            <div className="mt-5">
              {latestApplication ? (
                <div className="rounded-[20px] bg-bg p-5 neo-inset">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cx('rounded-full px-3 py-1 text-xs font-black', isPositiveStatus(latestApplication.currentStatus) ? 'bg-success/10 text-success' : isWarningStatus(latestApplication.currentStatus) ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                      {latestApplication.currentStatus}
                    </span>
                    {latestApplication.repeatCount > 1 && <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-black text-warning">Repeated x{latestApplication.repeatCount}</span>}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted">
                    <div>Role: {latestApplication.jobTitle}</div>
                    <div>Last applied: {formatDate(latestApplication.lastAppliedAt)}</div>
                    <div>HR comment: {latestApplication.hrComment || 'No recruiter comment yet'}</div>
                  </div>
                </div>
              ) : (
                <EmptyState title="No shared job selected" copy="Candidates can apply only from a company-provided apply link. Shared links look like /candidate/apply/J123." compact />
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-[24px] bg-bg p-6 neo-shadow">
          <h2 className="text-xl font-black">Recent applications</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {applications.length ? sortApplicationsByRecent(applications).map((application) => (
              <div className="rounded-[20px] bg-bg p-4 neo-inset" key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-black">{application.jobTitle}</div>
                    <div className="mt-1 text-xs text-muted">Applied on {formatDate(application.appliedAt)}</div>
                  </div>
                  <span className={cx('rounded-full px-3 py-1 text-xs font-black', isPositiveStatus(application.currentStatus) ? 'bg-success/10 text-success' : isWarningStatus(application.currentStatus) ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                    {application.currentStatus}
                  </span>
                </div>
                <div className="mt-3 text-sm text-muted">HR comment: {application.hrComment || 'No recruiter comment yet'}</div>
              </div>
            )) : <EmptyState title="No applications yet" copy="Open a company shared job link to apply and start tracking your status." compact />}
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
  const candidateProfile = loadSessionProfile('candidate')
  const [step, setStep] = useState(0)
  const [selectedJob, setSelectedJob] = useState(jobId || '')
  const [formState, setFormState] = useState(() => ({
    fullName: candidateProfile.fullName,
    email: candidateProfile.email,
    phone: candidateProfile.phone,
    location: candidateProfile.location,
  }))
  const steps = ['Select Job', 'Personal Details', 'Upload Resume', 'Add Skills', 'Screening Questions', 'Review Application', 'Submit Application']
  const invitedJob = jobs.find((job) => job.id === jobId)
  const isCandidateSignedIn = localStorage.getItem(storageKeys.candidateSession) === 'true'
  useEffect(() => {
    if (jobId && invitedJob && !isCandidateSignedIn) {
      navigate(`/candidate/signup?job=${jobId}`, { replace: true })
    }
  }, [invitedJob, isCandidateSignedIn, jobId, navigate])
  function submitApplication() {
    if (!invitedJob) return
    const applications = loadApplications()
    const previousApplications = sortApplicationsByRecent(applications.filter((application) => application.candidateEmail.toLowerCase() === formState.email.toLowerCase()))
    const now = new Date().toISOString()
    const nextApplication: ApplicationRecord = {
      id: `APP-${Date.now()}`,
      candidateId: formState.email.toLowerCase(),
      candidateName: formState.fullName || 'Candidate',
      candidateEmail: formState.email,
      candidatePhone: formState.phone,
      jobId: invitedJob.id,
      jobTitle: invitedJob.title,
      appliedAt: now,
      lastAppliedAt: now,
      currentStatus: 'Applied',
      hrComment: '',
      history: [{ status: 'Applied', hrComment: 'Application submitted by candidate.', updatedAt: now }],
      repeatCount: previousApplications.length + 1,
      source: 'candidate-application',
    }
    saveApplications([nextApplication, ...applications])
    saveSessionProfile('candidate', { ...candidateProfile, ...formState })
    const matchingCandidate = loadCandidates().find((candidate) => candidate.email.toLowerCase() === formState.email.toLowerCase())
    if (matchingCandidate) {
      syncCandidateStatus(matchingCandidate.id, matchingCandidate.email, 'Applied')
    }
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
            {step === 1 && [
              ['Full name', 'fullName'],
              ['Email', 'email'],
              ['Phone', 'phone'],
              ['Location', 'location'],
            ].map(([label, key]) => (
              <label key={key}>
                <span className="form-label">{label}</span>
                <input
                  className="neo-input"
                  placeholder={label}
                  value={formState[key as keyof typeof formState]}
                  onChange={(event) => setFormState({ ...formState, [key]: event.target.value })}
                />
              </label>
            ))}
            {step === 2 && <div className="md:col-span-2"><FileUploadBox title="Upload resume" accept=".pdf,.doc,.docx" format="CV" /></div>}
            {step === 3 && getRoleProfile(invitedJob).requiredSkills.map((skill) => <label className="flex items-center gap-3 rounded-[20px] bg-bg p-4 neo-inset" key={skill}><input type="checkbox" />{skill}</label>)}
            {step === 4 && ['Are you authorized to work?', 'Can you join within 30 days?', 'Describe a dashboard or project you built.'].map((q) => <label className="md:col-span-2" key={q}><span className="form-label">{q}</span><textarea className="neo-input min-h-20" /></label>)}
            {step === 5 && <EmptyState title="Review application" copy={`You are applying as ${formState.fullName || 'Candidate'} for ${invitedJob.title}. After submission, the recruiter can update status and HR comments in the dashboard.`} />}
            {step === 6 && <EmptyState title="Application submitted" copy={`Status: Applied. You can now track ${invitedJob.title} in your dashboard and the tracking page.`} />}
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
  const candidateProfile = loadSessionProfile('candidate')
  const applications = useStoredApplications().filter((application) => application.candidateEmail.toLowerCase() === candidateProfile.email.toLowerCase())
  return (
    <Shell role="candidate">
      <PageTransition>
        <SectionTitle eyebrow="Tracking" title="Application Tracking" copy="Monitor each application status from submission through selection." />
        {applications.length ? (
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {sortApplicationsByRecent(applications).map((application) => (
              <motion.div whileHover={{ y: -4 }} className="rounded-[24px] bg-bg p-6 neo-shadow" key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{application.jobTitle}</h2>
                    <p className="mt-2 text-sm text-muted">Applied on {formatDate(application.appliedAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cx('rounded-full px-3 py-1 text-xs font-black', isPositiveStatus(application.currentStatus) ? 'bg-success/10 text-success' : isWarningStatus(application.currentStatus) ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                      {application.currentStatus}
                    </span>
                    {application.repeatCount > 1 && <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-black text-warning">Repeated x{application.repeatCount}</span>}
                  </div>
                </div>
                <div className="mt-4 rounded-[20px] bg-bg p-4 neo-inset">
                  <div className="text-sm text-muted">HR comment: {application.hrComment || 'No recruiter comment yet'}</div>
                  <div className="mt-2 text-sm text-muted">Last updated: {formatDate(application.history[application.history.length - 1]?.updatedAt || application.lastAppliedAt)}</div>
                </div>
                <div className="mt-4 grid gap-3">
                  {application.history.length ? application.history.slice().reverse().map((entry, index) => (
                    <div className="flex gap-3 rounded-[18px] bg-bg p-3 neo-inset" key={`${application.id}-${entry.updatedAt}-${index}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary neo-shadow">{index + 1}</span>
                      <div>
                        <div className="font-black">{entry.status}</div>
                        <div className="mt-1 text-xs text-muted">{formatDate(entry.updatedAt)}</div>
                        <div className="mt-2 text-sm text-muted">{entry.hrComment || 'No comment recorded for this step.'}</div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted">No history recorded yet.</p>}
                </div>
              </motion.div>
            ))}
          </div>
        ) : <div className="mt-8"><EmptyState title="No applications yet" copy="Submit an application from a company shared job link to start tracking your status." action="/candidate/dashboard" actionLabel="Go to dashboard" /></div>}
      </PageTransition>
    </Shell>
  )
}

function CompanySettingsPage() {
  const [settings, setSettings] = useState<LlmSettings>(() => loadLlmSettings())
  const [saved, setSaved] = useState(false)
  return (
    <Shell role="company">
      <PageTransition>
        <SectionTitle eyebrow="Settings" title="LLM API and local matching settings" copy="TalentLens works locally without AI keys. Add an OpenAI-compatible LLM key only if you want the LLM to review and refine the local ranking output." />
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <form
            className="rounded-[24px] bg-bg p-6 neo-shadow"
            onSubmit={(event) => {
              event.preventDefault()
              saveLlmSettings(settings)
              setSaved(true)
            }}
          >
            <label className="flex items-center gap-3 rounded-[20px] bg-bg p-4 font-bold neo-inset">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
              />
              Enable LLM refinement after local ranking
            </label>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label><span className="form-label">Provider label</span><input className="neo-input" value={settings.provider} onChange={(event) => setSettings({ ...settings, provider: event.target.value })} /></label>
              <label><span className="form-label">Model</span><input className="neo-input" value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} placeholder="gpt-4o-mini" /></label>
            </div>
            <label className="mt-5 block"><span className="form-label">Chat completions endpoint</span><input className="neo-input" value={settings.endpoint} onChange={(event) => setSettings({ ...settings, endpoint: event.target.value })} placeholder="https://api.openai.com/v1/chat/completions" /></label>
            <label className="mt-5 block"><span className="form-label">API key</span><input className="neo-input" type="password" value={settings.apiKey} onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })} placeholder="sk-..." /></label>
            <div className="mt-5 rounded-[20px] bg-warning/10 p-4 text-sm font-bold text-warning">
              Frontend API keys are visible to the browser. Use this only for local demos. In production, proxy LLM calls through your backend.
            </div>
            <NeumorphicButton type="submit" className="mt-6"><KeyRound className="h-4 w-4" />Save LLM settings</NeumorphicButton>
            {saved && <div className="mt-4 rounded-[20px] bg-success/10 p-4 text-sm font-bold text-success">Settings saved locally and will be used on the next ranking run.</div>}
          </form>
          <div className="rounded-[24px] bg-bg p-6 neo-shadow">
            <h2 className="text-xl font-black">LLM output contract</h2>
            <p className="mt-3 text-sm leading-6 text-muted">The LLM receives the selected JD profile, local scores, and candidate evidence. It must return JSON in this shape:</p>
            <pre className="content-area mt-5 max-h-72 overflow-auto rounded-[20px] bg-bg p-4 text-xs leading-6 neo-inset">{`{
  "candidates": [
    {
      "id": "C101",
      "finalScore": 92,
      "semanticScore": 95,
      "skillScore": 88,
      "experienceScore": 90,
      "behaviorScore": 89,
      "activityScore": 86,
      "status": "Shortlisted",
      "reason": "Why this candidate fits the selected JD"
    }
  ]
}`}</pre>
            <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-bg p-4 neo-inset">
              <Server className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-muted">If `VITE_API_URL` is configured, backend `/rank` is attempted first. If it fails, local + optional frontend LLM fallback is used.</span>
            </div>
          </div>
        </div>
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
      <Route path="/company/settings" element={<ProtectedRoute role="company"><CompanySettingsPage /></ProtectedRoute>} />
      <Route path="/candidate/apply" element={<CandidateApplicationPage />} />
      <Route path="/candidate/apply/:jobId" element={<CandidateApplicationPage />} />
      <Route path="/candidate/tracking" element={<ProtectedRoute role="candidate"><ApplicationTrackingPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
