# TalentLens AI

TalentLens AI is a full-stack-ready AI recruitment website that helps companies rank candidates by real role fit instead of simple keyword matching. The current implementation is a polished React/Vite frontend with mock API behavior, downloadable ranking exports, pricing in INR, a demo request flow, and clear extension points for your own backend and AI provider keys.

## Problem Statement

Recruiters often receive large candidate datasets and struggle to identify candidates whose skills, experience, behavior, and platform activity genuinely match a role. Keyword search misses semantic relevance and gives little explanation for why a candidate should be shortlisted.

## Solution

TalentLens AI provides a recruiter-friendly workflow:

1. Upload or paste a job description.
2. Upload a candidate CSV/JSON dataset.
3. Run AI ranking using semantic, skill, experience, behavioral, and activity signals.
4. Review a ranked shortlist with explainable candidate details.
5. Export CSV/JSON results for ATS or reporting workflows.

## Features

- Premium light neumorphism SaaS UI
- Responsive premium landing page plus separate Features, Data, Workflow, Pricing, and Demo pages
- Local company/candidate authentication gates with demo credentials
- Company and candidate login/signup flows
- Company dashboard with charts and hiring metrics
- Candidate dashboard with resume upload and application tracking
- Create job form
- Job description upload and AI extraction preview
- Candidate dataset upload and preview
- Data guide explaining input files vs ranked output files
- Local AI-style ranking algorithm when no backend API is configured
- API fallback support through `VITE_API_URL`
- AI ranking result table with filters
- Candidate profile detail page with recruiter notes
- Workday-style candidate application stepper
- Downloadable CSV, JSON, and shortlist exports
- Uploaded CSV/JSON data drives dashboards, ranking tables, and candidate details
- Sample candidate CSV template download
- Pricing section in INR
- Demo request form for sales or CRM integration
- Mock API-ready architecture using Axios

## Tech Stack

- React + Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React icons
- React Router
- Recharts
- Axios

## Setup Instructions

Clone this GitHub repository and install dependencies:

```bash
git clone <your-github-repo-url>
cd <repo-folder>
npm install
npm run dev
```

Open the local Vite URL shown in your terminal, usually:

```bash
http://localhost:5173
```

## Deploy To Vercel

This project is Vercel-ready for a React + Vite single page app.

1. Push this repository to GitHub.
2. Open Vercel and choose **Add New Project**.
3. Import the GitHub repository.
4. Vercel should detect Vite automatically.
5. Use these settings if Vercel asks:

```txt
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

The included `vercel.json` also adds SPA rewrites so deep routes like `/company/login`, `/pricing`, and `/candidate/apply/:jobId` work after deployment.

Add production environment variables in Vercel Project Settings:

```env
VITE_API_URL=https://your-api.example.com
```

Key routes:

```txt
/features
/data
/workflow
/pricing
/demo
/company/upload-candidates
/company/ranking
```

Demo login credentials:

```txt
Company
Email: company@talentlens.ai
Password: Company@123

Candidate
Email: candidate@talentlens.ai
Password: Candidate@123
```

Create your own environment file when you connect a backend:

```bash
cp .env.example .env
```

Add your API URLs and provider keys:

```env
VITE_API_URL=http://localhost:8000
VITE_OPENAI_API_KEY=your_key_here
VITE_PINECONE_API_KEY=your_key_here
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

Do not commit real API keys to GitHub. For production, keep AI provider keys on the backend only and expose safe frontend endpoints.

## Backend Plan

The frontend runs a local AI-style ranking algorithm by default. If `VITE_API_URL` is set, the app will attempt to call backend ranking endpoints first and fall back to the local algorithm if the API is unavailable.

The backend can be connected to either:

- FastAPI backend with Python ranking pipelines
- Node.js/Express backend with vector search and scoring services

Suggested endpoints:

```txt
POST /auth/company/login
POST /auth/company/signup
POST /auth/candidate/login
POST /auth/candidate/signup
POST /jobs
POST /jobs/analyze
POST /candidates/upload
POST /rank
GET  /rankings/:jobId
GET  /candidates/:candidateId
POST /applications
GET  /applications/me
POST /demo-requests
```

## Ranking Method

Final Score =

```txt
40% Semantic Fit
25% Skill Match
20% Experience Match
10% Behavioral Signals
5% Activity Signals
```

Local scoring uses:

- Required and preferred skills from the saved job or pasted JD.
- Keyword/semantic overlap between role text and candidate resume/projects.
- Years of experience extracted from candidate data.
- Platform activity signals such as active usage, challenges, and verification.
- Recruiter-friendly explanations generated from the scoring evidence.

The UI visualizes this flow:

```txt
Job Description Upload
Candidate Dataset Upload
Preprocessing
Embedding Generation
Hybrid Scoring
Ranked Shortlist
CSV Export
```

## Data Usage

TalentLens AI uses two main inputs:

- Job description: pasted text, PDF, or DOCX.
- Candidate dataset: CSV or JSON containing candidate profile, skills, experience, projects, education, platform activity, and resume text.

The ranked output is generated after ranking. It can be downloaded as CSV/JSON from the ranking page. A PDF report upload block is included only for attaching an already generated ranked report to a job workspace.

Candidate applications are invite-link based. A company creates a job, copies the job-specific apply link, and shares it with candidates. Candidates who open `/candidate/apply/:jobId` are sent through signup/login first, then returned to that exact job application.

## Folder Structure

```txt
.
|-- index.html
|-- package.json
|-- README.md
|-- src
|   |-- App.tsx
|   |-- index.css
|   `-- main.tsx
`-- vite.config.ts
```

## Candidate Dataset Fields

Expected CSV/JSON fields:

```txt
candidate_id
name
email
skills
experience
projects
education
platform_activity
resume_text
```

## Output Format

Downloadable CSV format:

```csv
candidate_id,name,rank,final_score,skill_score,experience_score,semantic_score,reason
C101,Ayesha Khan,1,92,88,90,95,"Strong SQL, Power BI, analytics project experience and high role relevance"
C204,Rahul Sharma,2,87,85,82,91,"Good Python and dashboarding experience with relevant project background"
```

## Pricing Demo

The landing page includes sample INR plans:

- Starter: INR 4,999/month
- Growth: INR 14,999/month
- Enterprise: INR 49,999/month

These are frontend demo values. Replace them with real billing plans when connecting Stripe, Razorpay, or another billing provider.

## Production Notes

- Move AI keys to backend services before deployment.
- Add real auth, file storage, and database persistence.
- Replace mock ranking with embeddings, vector search, structured scoring, and audit logs.
- Connect the demo form to CRM, email, or backend storage.
- Add test coverage for upload parsing, scoring, exports, auth flows, and responsive layouts.
