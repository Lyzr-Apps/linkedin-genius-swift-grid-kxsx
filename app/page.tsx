'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { getSchedule, getScheduleLogs, pauseSchedule, resumeSchedule, triggerScheduleNow, cronToHuman, type Schedule, type ExecutionLog } from '@/lib/scheduler'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { FiEdit, FiCopy, FiCheck, FiImage, FiStar, FiClock, FiPlay, FiPause, FiRefreshCw, FiTrendingUp, FiFileText, FiBarChart2, FiShield, FiUsers, FiZap, FiChevronDown, FiChevronUp, FiTrash2, FiPlus, FiEye, FiX, FiAlertCircle, FiActivity, FiAward, FiBookOpen, FiMessageSquare, FiLayers, FiSettings } from 'react-icons/fi'

// =====================================================================
// CONSTANTS
// =====================================================================

const CONTENT_ORCHESTRATOR_ID = '698f051e12acde9bce1a2ed4'
const VISUAL_INTELLIGENCE_ID = '698f051ea5557543846dfa96'
const LLM_JUDGE_ID = '698f051f2ae20ba37e454295'
const SCHEDULE_ID = '698f052a399dfadeac3745bc'

const HISTORY_KEY = 'linkedin_content_history'

// =====================================================================
// THEME
// =====================================================================

const THEME_VARS: React.CSSProperties & Record<string, string> = {
  '--background': '220 25% 6%',
  '--foreground': '210 40% 96%',
  '--card': '220 20% 10%',
  '--card-foreground': '210 40% 96%',
  '--primary': '210 85% 45%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '220 18% 16%',
  '--secondary-foreground': '210 30% 85%',
  '--muted': '220 15% 14%',
  '--muted-foreground': '215 15% 55%',
  '--accent': '210 85% 45%',
  '--accent-foreground': '0 0% 100%',
  '--border': '220 15% 18%',
  '--input': '220 15% 18%',
  '--ring': '210 85% 50%',
}

// =====================================================================
// TYPES
// =====================================================================

interface ContentHistoryItem {
  id: string
  timestamp: string
  topic: string
  finalPost: string
  hashtags: string[]
  validationStatus: string
  tone: string
  targetAudience: string
  score?: number
  verdict?: string
}

interface ContentResult {
  final_post?: string
  research_summary?: string
  hashtags?: string[]
  validation_status?: string
  humanization_notes?: string
  revision_count?: string
  content_type?: string
  target_audience?: string
  tone?: string
}

interface VisualResult {
  visual_concept?: string
  image_type?: string
  carousel_ideas?: string[]
  infographic_concept?: string
  color_palette?: string[]
  design_notes?: string
}

interface JudgeResult {
  clarity_score?: number
  originality_score?: number
  authority_score?: number
  authenticity_score?: number
  engagement_potential_score?: number
  factual_integrity?: string
  overall_score?: number
  improvement_notes?: string[]
  strengths?: string[]
  verdict?: string
}

// =====================================================================
// SAMPLE DATA
// =====================================================================

const SAMPLE_CONTENT: ContentResult = {
  final_post: "The future of work isn't about replacing humans with AI -- it's about augmenting human capability.\n\nI spent the last quarter implementing AI tools across our 200-person engineering team, and here's what actually happened:\n\n1. Code review time dropped by 40%\n2. Bug detection improved by 65%\n3. Developer satisfaction went UP, not down\n4. Junior engineers ramped up 2x faster\n\nThe key insight? We didn't automate developers out of their jobs. We automated the tedious parts so they could focus on creative problem-solving.\n\nThree principles that made this work:\n\n- Start with pain points, not technology\n- Let teams choose their own AI tools\n- Measure outcomes, not adoption rates\n\nThe companies winning at AI aren't the ones with the biggest budgets. They're the ones treating AI as a collaborator, not a replacement.\n\nWhat's your experience been with AI in your workflow?",
  research_summary: "Recent studies from McKinsey (2024) show 72% of companies have adopted AI in at least one business function. Stanford HAI reports developer productivity gains of 30-55% with AI coding assistants. Gartner predicts 80% of software engineers will use AI code assistants by 2027. Employee satisfaction data from Microsoft Work Trend Index shows AI tools reduce 'digital debt' and improve focus time.",
  hashtags: ['#AITransformation', '#FutureOfWork', '#EngineeringLeadership', '#ArtificialIntelligence', '#TechLeadership'],
  validation_status: 'Approved',
  humanization_notes: 'Added personal anecdote about implementation experience. Replaced corporate jargon with conversational language. Included specific metrics for credibility. Ended with engagement question.',
  revision_count: '2',
  content_type: 'thought-leadership',
  target_audience: 'Tech Leaders',
  tone: 'Thought Leadership'
}

const SAMPLE_VISUAL: VisualResult = {
  visual_concept: 'Split-screen infographic showing "Before AI" vs "After AI" developer workflow with key metrics highlighted in blue accent colors. Clean, modern design with data visualization elements.',
  image_type: 'infographic',
  carousel_ideas: [
    'Slide 1: Bold statement "AI + Engineers = Superpowers"',
    'Slide 2: Before/After metrics comparison chart',
    'Slide 3: Three key principles with icons',
    'Slide 4: Call-to-action and discussion prompt'
  ],
  infographic_concept: 'Vertical flow chart showing the transformation journey from manual coding to AI-augmented development, with milestone markers at each improvement metric.',
  color_palette: ['#0A66C2', '#1B1F23', '#FFFFFF', '#38B2AC', '#F6AD55'],
  design_notes: 'Use LinkedIn brand-safe colors. Maintain high contrast for mobile readability. Include company logo placement area. Data visualizations should use bar charts for metric comparisons.'
}

const SAMPLE_JUDGE: JudgeResult = {
  clarity_score: 9,
  originality_score: 8,
  authority_score: 8,
  authenticity_score: 9,
  engagement_potential_score: 9,
  factual_integrity: 'Pass',
  overall_score: 8.6,
  improvement_notes: [
    'Consider adding a specific company name or context for stronger authority signal',
    'The CTA question is good but could be more specific to drive targeted responses'
  ],
  strengths: [
    'Strong personal narrative grounded in real data',
    'Clear, scannable structure with numbered lists',
    'Balanced perspective avoids AI hype',
    'Specific metrics add credibility',
    'Engagement-friendly closing question'
  ],
  verdict: 'PUBLISH_READY'
}

const SAMPLE_HISTORY: ContentHistoryItem[] = [
  {
    id: 'sample-1',
    timestamp: '2024-12-15T10:30:00Z',
    topic: 'AI in Engineering Teams',
    finalPost: SAMPLE_CONTENT.final_post || '',
    hashtags: SAMPLE_CONTENT.hashtags || [],
    validationStatus: 'Approved',
    tone: 'Thought Leadership',
    targetAudience: 'Tech Leaders',
    score: 8.6,
    verdict: 'PUBLISH_READY'
  },
  {
    id: 'sample-2',
    timestamp: '2024-12-14T14:20:00Z',
    topic: 'Remote Work Productivity',
    finalPost: 'After 3 years of remote-first culture, here are our honest results...',
    hashtags: ['#RemoteWork', '#ProductivityTips', '#Leadership'],
    validationStatus: 'Approved',
    tone: 'Conversational',
    targetAudience: 'General Professional',
    score: 7.8,
    verdict: 'PUBLISH_READY'
  },
  {
    id: 'sample-3',
    timestamp: '2024-12-13T09:15:00Z',
    topic: 'Startup Funding Landscape 2025',
    finalPost: 'The VC landscape has fundamentally shifted. Here is what founders need to know...',
    hashtags: ['#Startup', '#VentureCapital', '#Founders'],
    validationStatus: 'Revised',
    tone: 'Analytical',
    targetAudience: 'Startup',
    score: 8.2,
    verdict: 'PUBLISH_READY'
  }
]

// =====================================================================
// HELPERS
// =====================================================================

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}

function getVerdictColor(verdict?: string): string {
  if (!verdict) return 'bg-gray-600'
  if (verdict === 'PUBLISH_READY') return 'bg-emerald-600'
  if (verdict === 'NEEDS_REVISION') return 'bg-amber-600'
  return 'bg-red-600'
}

function getVerdictLabel(verdict?: string): string {
  if (!verdict) return 'Unknown'
  if (verdict === 'PUBLISH_READY') return 'Publish Ready'
  if (verdict === 'NEEDS_REVISION') return 'Needs Revision'
  if (verdict === 'SIGNIFICANT_REWORK') return 'Significant Rework'
  return verdict
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return 'N/A'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-4 h-4'
  return (
    <svg className={`${sizeClass} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const pct = Math.min(Math.max((score / 10) * 100, 0), 100)
  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-semibold text-white">{score}/10</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function WorkflowStep({ step, label, isActive, isComplete }: { step: number; label: string; isActive: boolean; isComplete: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${isComplete ? 'bg-emerald-600 text-white' : isActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
        {isComplete ? <FiCheck className="w-4 h-4" /> : step}
      </div>
      <span className={`text-sm transition-colors duration-300 ${isActive ? 'text-blue-400 font-medium' : isComplete ? 'text-emerald-400' : 'text-slate-500'}`}>
        {label}
      </span>
      {isActive && <LoadingSpinner size="sm" />}
    </div>
  )
}

function LinkedInPostPreview({ post, hashtags }: { post: string; hashtags: string[] }) {
  const safeHashtags = Array.isArray(hashtags) ? hashtags : []
  return (
    <div className="bg-white rounded-xl p-5 text-slate-900 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
          <FiUsers className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Your Name</p>
          <p className="text-xs text-slate-500">Your Title | Just now</p>
        </div>
      </div>
      <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-3">{post || 'No content generated yet.'}</div>
      {safeHashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {safeHashtags.map((tag, i) => (
            <span key={i} className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">{tag?.startsWith('#') ? tag : `#${tag}`}</span>
          ))}
        </div>
      )}
      <Separator className="my-3 bg-slate-200" />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Like</span>
        <span>Comment</span>
        <span>Repost</span>
        <span>Send</span>
      </div>
    </div>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: CONTENT_ORCHESTRATOR_ID, name: 'Content Orchestrator', role: 'Research, write, validate, humanize' },
    { id: VISUAL_INTELLIGENCE_ID, name: 'Visual Intelligence', role: 'Generate visuals and design concepts' },
    { id: LLM_JUDGE_ID, name: 'LLM Judge', role: 'Evaluate content quality (1-10 scoring)' }
  ]
  return (
    <Card className="bg-slate-900/60 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <FiActivity className="w-4 h-4 text-blue-400" />
          Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center gap-3 py-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium truncate ${activeAgentId === agent.id ? 'text-blue-300' : 'text-slate-400'}`}>{agent.name}</p>
              <p className="text-xs text-slate-600 truncate">{agent.role}</p>
            </div>
            {activeAgentId === agent.id && <LoadingSpinner size="sm" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// =====================================================================
// MAIN PAGE
// =====================================================================

export default function Page() {
  // Navigation
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'create' | 'schedule'>('dashboard')

  // Sample data toggle
  const [showSample, setShowSample] = useState(false)

  // Create Content state
  const [inputType, setInputType] = useState<'topic' | 'url' | 'idea' | 'article'>('topic')
  const [inputText, setInputText] = useState('')
  const [toneSelect, setToneSelect] = useState('Professional')
  const [audienceSelect, setAudienceSelect] = useState('General Professional')
  const [postLength, setPostLength] = useState('Medium (150-300 words)')
  const [ctaStyle, setCtaStyle] = useState('Question')

  // Agent results
  const [contentResult, setContentResult] = useState<ContentResult | null>(null)
  const [visualResult, setVisualResult] = useState<VisualResult | null>(null)
  const [visualImageUrl, setVisualImageUrl] = useState<string | null>(null)
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null)

  // Loading states
  const [contentLoading, setContentLoading] = useState(false)
  const [visualLoading, setVisualLoading] = useState(false)
  const [judgeLoading, setJudgeLoading] = useState(false)
  const [workflowStep, setWorkflowStep] = useState(0)

  // Active agent
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // UI states
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showVisualPanel, setShowVisualPanel] = useState(false)
  const [showEvalPanel, setShowEvalPanel] = useState(false)
  const [researchOpen, setResearchOpen] = useState(false)
  const [humanNotesOpen, setHumanNotesOpen] = useState(false)

  // History
  const [history, setHistory] = useState<ContentHistoryItem[]>([])
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ContentHistoryItem | null>(null)

  // Schedule state
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [scheduleLogs, setScheduleLogs] = useState<ExecutionLog[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleActionMsg, setScheduleActionMsg] = useState<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Save history to localStorage
  const saveHistory = useCallback((items: ContentHistoryItem[]) => {
    setHistory(items)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [])

  // Clear messages after delay
  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(null), 6000)
      return () => clearTimeout(t)
    }
  }, [errorMsg])

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  useEffect(() => {
    if (scheduleActionMsg) {
      const t = setTimeout(() => setScheduleActionMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [scheduleActionMsg])

  // =====================================================================
  // AGENT CALLS
  // =====================================================================

  const handleGenerateContent = useCallback(async () => {
    if (!inputText.trim()) {
      setErrorMsg('Please enter a topic, URL, idea, or article to generate content.')
      return
    }

    setContentLoading(true)
    setContentResult(null)
    setVisualResult(null)
    setVisualImageUrl(null)
    setJudgeResult(null)
    setShowVisualPanel(false)
    setShowEvalPanel(false)
    setErrorMsg(null)
    setActiveAgentId(CONTENT_ORCHESTRATOR_ID)

    const message = `Input type: ${inputType}\nContent: ${inputText}\nTone: ${toneSelect}\nTarget Audience: ${audienceSelect}\nPost Length: ${postLength}\nCTA Style: ${ctaStyle}`

    // Simulate workflow steps
    setWorkflowStep(1)
    const stepTimer1 = setTimeout(() => setWorkflowStep(2), 3000)
    const stepTimer2 = setTimeout(() => setWorkflowStep(3), 6000)
    const stepTimer3 = setTimeout(() => setWorkflowStep(4), 9000)

    try {
      const result = await callAIAgent(message, CONTENT_ORCHESTRATOR_ID)

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      clearTimeout(stepTimer3)
      setWorkflowStep(5)

      if (result?.success && result?.response?.result) {
        const data = result.response.result as ContentResult
        setContentResult({
          final_post: data?.final_post ?? '',
          research_summary: data?.research_summary ?? '',
          hashtags: Array.isArray(data?.hashtags) ? data.hashtags : [],
          validation_status: data?.validation_status ?? '',
          humanization_notes: data?.humanization_notes ?? '',
          revision_count: data?.revision_count ?? '',
          content_type: data?.content_type ?? '',
          target_audience: data?.target_audience ?? '',
          tone: data?.tone ?? ''
        })
        setSuccessMsg('Content generated successfully!')
      } else {
        setErrorMsg(result?.error ?? 'Failed to generate content. Please try again.')
      }
    } catch (err) {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      clearTimeout(stepTimer3)
      setErrorMsg('An error occurred while generating content. Please try again.')
    } finally {
      setContentLoading(false)
      setActiveAgentId(null)
      setTimeout(() => setWorkflowStep(0), 2000)
    }
  }, [inputText, inputType, toneSelect, audienceSelect, postLength, ctaStyle])

  const handleGenerateVisual = useCallback(async () => {
    const post = contentResult?.final_post ?? ''
    if (!post) {
      setErrorMsg('Generate content first before creating visuals.')
      return
    }

    setVisualLoading(true)
    setShowVisualPanel(true)
    setVisualResult(null)
    setVisualImageUrl(null)
    setErrorMsg(null)
    setActiveAgentId(VISUAL_INTELLIGENCE_ID)

    try {
      const result = await callAIAgent(`Generate a visual for this LinkedIn post:\n\n${post}`, VISUAL_INTELLIGENCE_ID)

      if (result?.success && result?.response?.result) {
        const data = result.response.result as VisualResult
        setVisualResult({
          visual_concept: data?.visual_concept ?? '',
          image_type: data?.image_type ?? '',
          carousel_ideas: Array.isArray(data?.carousel_ideas) ? data.carousel_ideas : [],
          infographic_concept: data?.infographic_concept ?? '',
          color_palette: Array.isArray(data?.color_palette) ? data.color_palette : [],
          design_notes: data?.design_notes ?? ''
        })
        const artifactFiles = Array.isArray(result?.module_outputs?.artifact_files) ? result.module_outputs.artifact_files : []
        if (artifactFiles.length > 0 && artifactFiles[0]?.file_url) {
          setVisualImageUrl(artifactFiles[0].file_url)
        }
        setSuccessMsg('Visual generated successfully!')
      } else {
        setErrorMsg(result?.error ?? 'Failed to generate visual.')
      }
    } catch {
      setErrorMsg('An error occurred while generating visual.')
    } finally {
      setVisualLoading(false)
      setActiveAgentId(null)
    }
  }, [contentResult])

  const handleRunEvaluation = useCallback(async () => {
    const post = contentResult?.final_post ?? ''
    if (!post) {
      setErrorMsg('Generate content first before running evaluation.')
      return
    }

    setJudgeLoading(true)
    setShowEvalPanel(true)
    setJudgeResult(null)
    setErrorMsg(null)
    setActiveAgentId(LLM_JUDGE_ID)

    try {
      const result = await callAIAgent(`Evaluate this LinkedIn post:\n\n${post}`, LLM_JUDGE_ID)

      if (result?.success && result?.response?.result) {
        const data = result.response.result as JudgeResult
        setJudgeResult({
          clarity_score: typeof data?.clarity_score === 'number' ? data.clarity_score : 0,
          originality_score: typeof data?.originality_score === 'number' ? data.originality_score : 0,
          authority_score: typeof data?.authority_score === 'number' ? data.authority_score : 0,
          authenticity_score: typeof data?.authenticity_score === 'number' ? data.authenticity_score : 0,
          engagement_potential_score: typeof data?.engagement_potential_score === 'number' ? data.engagement_potential_score : 0,
          factual_integrity: data?.factual_integrity ?? 'Unknown',
          overall_score: typeof data?.overall_score === 'number' ? data.overall_score : 0,
          improvement_notes: Array.isArray(data?.improvement_notes) ? data.improvement_notes : [],
          strengths: Array.isArray(data?.strengths) ? data.strengths : [],
          verdict: data?.verdict ?? 'Unknown'
        })
        setSuccessMsg('Evaluation complete!')
      } else {
        setErrorMsg(result?.error ?? 'Failed to evaluate content.')
      }
    } catch {
      setErrorMsg('An error occurred during evaluation.')
    } finally {
      setJudgeLoading(false)
      setActiveAgentId(null)
    }
  }, [contentResult])

  const handleSaveToHistory = useCallback(() => {
    if (!contentResult?.final_post) {
      setErrorMsg('No content to save.')
      return
    }
    const item: ContentHistoryItem = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      topic: inputText.slice(0, 100),
      finalPost: contentResult.final_post ?? '',
      hashtags: Array.isArray(contentResult.hashtags) ? contentResult.hashtags : [],
      validationStatus: contentResult.validation_status ?? '',
      tone: contentResult.tone ?? toneSelect,
      targetAudience: contentResult.target_audience ?? audienceSelect,
      score: judgeResult?.overall_score,
      verdict: judgeResult?.verdict
    }
    const updated = [item, ...history]
    saveHistory(updated)
    setSuccessMsg('Content saved to history!')
  }, [contentResult, inputText, toneSelect, audienceSelect, judgeResult, history, saveHistory])

  const handleCopy = useCallback(async () => {
    const text = contentResult?.final_post ?? ''
    if (!text) return
    const hashtagStr = Array.isArray(contentResult?.hashtags) ? '\n\n' + contentResult.hashtags.join(' ') : ''
    const ok = await copyToClipboard(text + hashtagStr)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [contentResult])

  const handleDeleteHistory = useCallback((id: string) => {
    const updated = history.filter(h => h.id !== id)
    saveHistory(updated)
  }, [history, saveHistory])

  // =====================================================================
  // SCHEDULE FUNCTIONS
  // =====================================================================

  const fetchScheduleData = useCallback(async () => {
    setScheduleLoading(true)
    setScheduleError(null)
    try {
      const [schedRes, logRes] = await Promise.all([
        getSchedule(SCHEDULE_ID),
        getScheduleLogs(SCHEDULE_ID, { limit: 10 })
      ])

      if (schedRes?.success && schedRes?.schedule) {
        setSchedule(schedRes.schedule)
      } else {
        setScheduleError(schedRes?.error ?? 'Failed to load schedule')
      }

      if (logRes?.success) {
        setScheduleLogs(Array.isArray(logRes?.executions) ? logRes.executions : [])
      }
    } catch {
      setScheduleError('Failed to load schedule data')
    } finally {
      setScheduleLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeScreen === 'schedule') {
      fetchScheduleData()
    }
  }, [activeScreen, fetchScheduleData])

  const handleToggleSchedule = useCallback(async () => {
    if (!schedule) return
    setScheduleLoading(true)
    setScheduleError(null)
    try {
      const result = schedule.is_active
        ? await pauseSchedule(SCHEDULE_ID)
        : await resumeSchedule(SCHEDULE_ID)
      if (result?.success) {
        setScheduleActionMsg(schedule.is_active ? 'Schedule paused' : 'Schedule resumed')
        await fetchScheduleData()
      } else {
        setScheduleError(result?.error ?? 'Failed to toggle schedule')
      }
    } catch {
      setScheduleError('Failed to toggle schedule')
    } finally {
      setScheduleLoading(false)
    }
  }, [schedule, fetchScheduleData])

  const handleTriggerNow = useCallback(async () => {
    setScheduleLoading(true)
    setScheduleError(null)
    try {
      const result = await triggerScheduleNow(SCHEDULE_ID)
      if (result?.success) {
        setScheduleActionMsg('Schedule triggered manually!')
        setTimeout(() => fetchScheduleData(), 2000)
      } else {
        setScheduleError(result?.error ?? 'Failed to trigger schedule')
      }
    } catch {
      setScheduleError('Failed to trigger schedule')
    } finally {
      setScheduleLoading(false)
    }
  }, [fetchScheduleData])

  // Determine display data based on sample toggle
  const displayContent = showSample ? SAMPLE_CONTENT : contentResult
  const displayVisual = showSample ? SAMPLE_VISUAL : visualResult
  const displayJudge = showSample ? SAMPLE_JUDGE : judgeResult
  const displayHistory = showSample ? SAMPLE_HISTORY : history
  const displayImageUrl = showSample ? 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop' : visualImageUrl

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <div style={THEME_VARS} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <FiEdit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">LinkedIn Genius</h1>
                <p className="text-xs text-slate-500 -mt-0.5">Content Engine</p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              {[
                { key: 'dashboard' as const, label: 'Dashboard', icon: <FiLayers className="w-4 h-4" /> },
                { key: 'create' as const, label: 'Create', icon: <FiEdit className="w-4 h-4" /> },
                { key: 'schedule' as const, label: 'Schedule', icon: <FiClock className="w-4 h-4" /> }
              ].map((nav) => (
                <button
                  key={nav.key}
                  onClick={() => setActiveScreen(nav.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeScreen === nav.key ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                >
                  {nav.icon}
                  <span className="hidden sm:inline">{nav.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-slate-500">Sample Data</Label>
              <Switch
                id="sample-toggle"
                checked={showSample}
                onCheckedChange={(checked) => {
                  setShowSample(checked)
                  if (checked) {
                    setShowVisualPanel(true)
                    setShowEvalPanel(true)
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Status Messages */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 text-sm">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-200"><FiX className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-sm">
            <FiCheck className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* =====================================================
            DASHBOARD SCREEN
            ===================================================== */}
        {activeScreen === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Welcome to LinkedIn Genius</h2>
                <p className="text-slate-400 mt-1">AI-powered content engine for high-performing LinkedIn posts</p>
              </div>
              <Button onClick={() => setActiveScreen('create')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <FiPlus className="w-4 h-4" />
                Create New Content
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-slate-900/60 border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <FiFileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{displayHistory.length}</p>
                      <p className="text-xs text-slate-500">Total Generated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                      <FiClock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">1</p>
                      <p className="text-xs text-slate-500">Scheduled Posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                      <FiTrendingUp className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {displayHistory.length > 0 ? (displayHistory.reduce((sum, h) => sum + (h?.score ?? 0), 0) / displayHistory.filter(h => typeof h?.score === 'number' && h.score > 0).length || 0).toFixed(1) : '--'}
                      </p>
                      <p className="text-xs text-slate-500">Average Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/60 border-blue-800/40 cursor-pointer hover:border-blue-600/60 transition-all" onClick={() => setActiveScreen('create')}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 flex items-center justify-center">
                    <FiZap className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Create New Content</p>
                    <p className="text-xs text-blue-300/70">Generate a LinkedIn post with AI</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border-emerald-800/40 cursor-pointer hover:border-emerald-600/60 transition-all" onClick={() => setActiveScreen('schedule')}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/30 flex items-center justify-center">
                    <FiClock className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">View Schedule</p>
                    <p className="text-xs text-emerald-300/70">Manage automated content generation</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content History */}
            <Card className="bg-slate-900/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiBookOpen className="w-5 h-5 text-blue-400" />
                  Content History
                </CardTitle>
                <CardDescription className="text-slate-500">Previously generated LinkedIn posts</CardDescription>
              </CardHeader>
              <CardContent>
                {displayHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <FiFileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-sm">No content generated yet. Create your first post!</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {displayHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:border-slate-600/60 transition-all cursor-pointer"
                          onClick={() => setSelectedHistoryItem(item)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white text-sm truncate">{item?.topic ?? 'Untitled'}</p>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{(item?.finalPost ?? '').slice(0, 150)}...</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{item?.tone ?? 'N/A'}</Badge>
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{item?.targetAudience ?? 'N/A'}</Badge>
                                {typeof item?.score === 'number' && item.score > 0 && (
                                  <Badge className={`text-xs text-white ${getVerdictColor(item.verdict)}`}>{item.score.toFixed(1)}/10</Badge>
                                )}
                                <span className="text-xs text-slate-600 ml-auto">{formatTimestamp(item?.timestamp)}</span>
                              </div>
                            </div>
                            {!showSample && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                                className="text-slate-600 hover:text-red-400 transition-colors p-1"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* History Detail Modal */}
            {selectedHistoryItem && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedHistoryItem(null)}>
                <Card className="bg-slate-900 border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                    <div>
                      <CardTitle className="text-white">{selectedHistoryItem?.topic ?? 'Untitled'}</CardTitle>
                      <CardDescription className="text-slate-500">{formatTimestamp(selectedHistoryItem?.timestamp)}</CardDescription>
                    </div>
                    <button onClick={() => setSelectedHistoryItem(null)} className="text-slate-400 hover:text-white"><FiX className="w-5 h-5" /></button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-4 pb-4">
                      <LinkedInPostPreview post={selectedHistoryItem?.finalPost ?? ''} hashtags={Array.isArray(selectedHistoryItem?.hashtags) ? selectedHistoryItem.hashtags : []} />
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">{selectedHistoryItem?.tone ?? 'N/A'}</Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">{selectedHistoryItem?.targetAudience ?? 'N/A'}</Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">{selectedHistoryItem?.validationStatus ?? 'N/A'}</Badge>
                        {typeof selectedHistoryItem?.score === 'number' && selectedHistoryItem.score > 0 && (
                          <Badge className={`text-white ${getVerdictColor(selectedHistoryItem.verdict)}`}>{selectedHistoryItem.score.toFixed(1)}/10 - {getVerdictLabel(selectedHistoryItem.verdict)}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Agent Status */}
            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>
        )}

        {/* =====================================================
            CREATE CONTENT SCREEN
            ===================================================== */}
        {activeScreen === 'create' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Create Content</h2>
                <p className="text-slate-400 mt-1">Generate high-quality LinkedIn posts powered by AI</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Input */}
              <div className="lg:col-span-1 space-y-4">
                {/* Input Type */}
                <Card className="bg-slate-900/60 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Input Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {(['topic', 'url', 'idea', 'article'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setInputType(type)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${inputType === type ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'}`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Input */}
                <Card className="bg-slate-900/60 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">
                      {inputType === 'topic' ? 'Topic' : inputType === 'url' ? 'URL' : inputType === 'idea' ? 'Idea' : 'Article'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={inputType === 'topic' ? 'Enter a topic (e.g., AI in engineering teams)...' : inputType === 'url' ? 'Paste a URL to an article...' : inputType === 'idea' ? 'Describe your idea...' : 'Paste your article text...'}
                      value={showSample ? 'How AI is transforming engineering team productivity and developer satisfaction' : inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 resize-none"
                      disabled={showSample}
                    />
                  </CardContent>
                </Card>

                {/* Configuration */}
                <Card className="bg-slate-900/60 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <FiSettings className="w-4 h-4" />
                      Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tone */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Tone</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Professional', 'Conversational', 'Thought Leadership', 'Storytelling', 'Analytical'].map((tone) => (
                          <button
                            key={tone}
                            onClick={() => setToneSelect(tone)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${toneSelect === tone ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-300'}`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Audience */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Target Audience</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {['C-Suite', 'Marketing', 'Tech', 'General Professional', 'Startup'].map((aud) => (
                          <button
                            key={aud}
                            onClick={() => setAudienceSelect(aud)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${audienceSelect === aud ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-300'}`}
                          >
                            {aud}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Post Length */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Post Length</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Short (< 150 words)', 'Medium (150-300 words)', 'Long (300+ words)'].map((len) => (
                          <button
                            key={len}
                            onClick={() => setPostLength(len)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${postLength === len ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-300'}`}
                          >
                            {len}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* CTA */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">CTA Style</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Question', 'Discussion', 'Action', 'None'].map((cta) => (
                          <button
                            key={cta}
                            onClick={() => setCtaStyle(cta)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${ctaStyle === cta ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-300'}`}
                          >
                            {cta}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateContent}
                  disabled={contentLoading || showSample}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-sm font-semibold gap-2"
                >
                  {contentLoading ? <LoadingSpinner size="sm" /> : <FiZap className="w-4 h-4" />}
                  {contentLoading ? 'Generating...' : 'Generate Content'}
                </Button>

                {/* Workflow Progress */}
                {contentLoading && workflowStep > 0 && (
                  <Card className="bg-slate-900/60 border-slate-700/50">
                    <CardContent className="p-4 space-y-3">
                      <WorkflowStep step={1} label="Researching topic..." isActive={workflowStep === 1} isComplete={workflowStep > 1} />
                      <WorkflowStep step={2} label="Writing LinkedIn post..." isActive={workflowStep === 2} isComplete={workflowStep > 2} />
                      <WorkflowStep step={3} label="Validating facts..." isActive={workflowStep === 3} isComplete={workflowStep > 3} />
                      <WorkflowStep step={4} label="Humanizing content..." isActive={workflowStep === 4} isComplete={workflowStep > 4} />
                    </CardContent>
                  </Card>
                )}

                {/* Agent Status */}
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>

              {/* Right Column: Output */}
              <div className="lg:col-span-2 space-y-4">
                {/* No content state */}
                {!displayContent && !contentLoading && (
                  <Card className="bg-slate-900/60 border-slate-700/50">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
                        <FiEdit className="w-8 h-8 text-blue-500/50" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Create</h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Enter a topic, URL, idea, or article on the left, configure your preferences, and click Generate Content to create a professional LinkedIn post.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Content loading skeleton */}
                {contentLoading && !displayContent && (
                  <Card className="bg-slate-900/60 border-slate-700/50">
                    <CardContent className="p-6 space-y-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-700 rounded w-3/4" />
                        <div className="h-4 bg-slate-700 rounded w-full" />
                        <div className="h-4 bg-slate-700 rounded w-5/6" />
                        <div className="h-4 bg-slate-700 rounded w-2/3" />
                        <div className="h-32 bg-slate-700 rounded mt-4" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generated Content */}
                {displayContent && (
                  <>
                    {/* LinkedIn Post Preview */}
                    <Card className="bg-slate-900/60 border-slate-700/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <FiFileText className="w-4 h-4 text-blue-400" />
                            Generated Post
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {displayContent?.validation_status && (
                              <Badge className={displayContent.validation_status === 'Approved' ? 'bg-emerald-600/80 text-white' : 'bg-amber-600/80 text-white'}>{displayContent.validation_status}</Badge>
                            )}
                            {displayContent?.revision_count && (
                              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">Rev: {displayContent.revision_count}</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <LinkedInPostPreview post={displayContent?.final_post ?? ''} hashtags={Array.isArray(displayContent?.hashtags) ? displayContent.hashtags : []} />
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2 pt-0 pb-4 px-6">
                        {displayContent?.content_type && (
                          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">{displayContent.content_type}</Badge>
                        )}
                        {displayContent?.target_audience && (
                          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs flex items-center gap-1">
                            <FiUsers className="w-3 h-3" /> {displayContent.target_audience}
                          </Badge>
                        )}
                        {displayContent?.tone && (
                          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs flex items-center gap-1">
                            <FiMessageSquare className="w-3 h-3" /> {displayContent.tone}
                          </Badge>
                        )}
                      </CardFooter>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleCopy} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
                        {copied ? <FiCheck className="w-4 h-4 text-emerald-400" /> : <FiCopy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </Button>
                      <Button onClick={handleGenerateVisual} disabled={visualLoading || showSample} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
                        {visualLoading ? <LoadingSpinner size="sm" /> : <FiImage className="w-4 h-4" />}
                        Generate Visual
                      </Button>
                      <Button onClick={handleRunEvaluation} disabled={judgeLoading || showSample} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
                        {judgeLoading ? <LoadingSpinner size="sm" /> : <FiBarChart2 className="w-4 h-4" />}
                        Run Evaluation
                      </Button>
                      <Button onClick={handleGenerateContent} disabled={contentLoading || showSample} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
                        <FiRefreshCw className="w-4 h-4" />
                        Regenerate
                      </Button>
                      <Button onClick={handleSaveToHistory} disabled={showSample} variant="outline" className="border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/30 gap-2">
                        <FiStar className="w-4 h-4" />
                        Save to History
                      </Button>
                    </div>

                    {/* Research Summary */}
                    {displayContent?.research_summary && (
                      <Collapsible open={researchOpen} onOpenChange={setResearchOpen}>
                        <Card className="bg-slate-900/60 border-slate-700/50">
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                  <FiBookOpen className="w-4 h-4 text-amber-400" />
                                  Research Insights
                                </CardTitle>
                                {researchOpen ? <FiChevronUp className="w-4 h-4 text-slate-500" /> : <FiChevronDown className="w-4 h-4 text-slate-500" />}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0 text-slate-300">
                              {renderMarkdown(displayContent.research_summary)}
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    )}

                    {/* Humanization Notes */}
                    {displayContent?.humanization_notes && (
                      <Collapsible open={humanNotesOpen} onOpenChange={setHumanNotesOpen}>
                        <Card className="bg-slate-900/60 border-slate-700/50">
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                  <FiUsers className="w-4 h-4 text-purple-400" />
                                  Humanization Notes
                                </CardTitle>
                                {humanNotesOpen ? <FiChevronUp className="w-4 h-4 text-slate-500" /> : <FiChevronDown className="w-4 h-4 text-slate-500" />}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0 text-slate-300">
                              {renderMarkdown(displayContent.humanization_notes)}
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    )}

                    {/* Visual Generation Panel */}
                    {(showVisualPanel || showSample) && (
                      <Card className="bg-slate-900/60 border-slate-700/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <FiImage className="w-4 h-4 text-pink-400" />
                            Visual Intelligence
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {visualLoading && (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center space-y-3">
                                <LoadingSpinner size="lg" />
                                <p className="text-sm text-slate-400">Generating visual...</p>
                              </div>
                            </div>
                          )}
                          {displayVisual && !visualLoading && (
                            <div className="space-y-4">
                              {/* Generated Image */}
                              {displayImageUrl && (
                                <div className="rounded-lg overflow-hidden border border-slate-700/50">
                                  <img
                                    src={displayImageUrl}
                                    alt="Generated visual"
                                    className="w-full h-auto max-h-80 object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                </div>
                              )}

                              {/* Visual Concept */}
                              {displayVisual.visual_concept && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Visual Concept</p>
                                  <p className="text-sm text-slate-300">{displayVisual.visual_concept}</p>
                                </div>
                              )}

                              {/* Image Type */}
                              {displayVisual.image_type && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500">Image Type:</span>
                                  <Badge variant="outline" className="border-pink-700/50 text-pink-300 text-xs">{displayVisual.image_type}</Badge>
                                </div>
                              )}

                              {/* Carousel Ideas */}
                              {Array.isArray(displayVisual.carousel_ideas) && displayVisual.carousel_ideas.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Carousel Ideas</p>
                                  <div className="space-y-1.5">
                                    {displayVisual.carousel_ideas.map((idea, i) => (
                                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-slate-800/40">
                                        <span className="text-xs font-semibold text-blue-400 mt-0.5">{i + 1}.</span>
                                        <p className="text-xs text-slate-300">{idea ?? ''}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Infographic Concept */}
                              {displayVisual.infographic_concept && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Infographic Concept</p>
                                  <p className="text-sm text-slate-300">{displayVisual.infographic_concept}</p>
                                </div>
                              )}

                              {/* Color Palette */}
                              {Array.isArray(displayVisual.color_palette) && displayVisual.color_palette.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Color Palette</p>
                                  <div className="flex gap-2">
                                    {displayVisual.color_palette.map((color, i) => (
                                      <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-lg border border-slate-600" style={{ backgroundColor: color ?? '#333' }} />
                                        <span className="text-xs text-slate-500">{color ?? ''}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Design Notes */}
                              {displayVisual.design_notes && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Design Notes</p>
                                  <p className="text-sm text-slate-300">{displayVisual.design_notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Evaluation Panel */}
                    {(showEvalPanel || showSample) && (
                      <Card className="bg-slate-900/60 border-slate-700/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <FiBarChart2 className="w-4 h-4 text-emerald-400" />
                            Content Evaluation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {judgeLoading && (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center space-y-3">
                                <LoadingSpinner size="lg" />
                                <p className="text-sm text-slate-400">Evaluating content...</p>
                              </div>
                            </div>
                          )}
                          {displayJudge && !judgeLoading && (
                            <div className="space-y-5">
                              {/* Overall Score + Verdict */}
                              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="#334155" strokeWidth="6" />
                                    <circle cx="40" cy="40" r="34" fill="none" stroke={typeof displayJudge.overall_score === 'number' && displayJudge.overall_score >= 7 ? '#10b981' : typeof displayJudge.overall_score === 'number' && displayJudge.overall_score >= 5 ? '#f59e0b' : '#ef4444'} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${((typeof displayJudge.overall_score === 'number' ? displayJudge.overall_score : 0) / 10) * 213.6} 213.6`} />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold text-white">{typeof displayJudge.overall_score === 'number' ? displayJudge.overall_score.toFixed(1) : '0'}</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-white">Overall Score</p>
                                  <Badge className={`mt-1 text-white ${getVerdictColor(displayJudge.verdict)}`}>{getVerdictLabel(displayJudge.verdict)}</Badge>
                                  <div className="flex items-center gap-2 mt-2">
                                    <FiShield className={`w-4 h-4 ${displayJudge.factual_integrity === 'Pass' ? 'text-emerald-400' : 'text-red-400'}`} />
                                    <span className={`text-xs font-medium ${displayJudge.factual_integrity === 'Pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                                      Factual Integrity: {displayJudge.factual_integrity ?? 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Score Bars */}
                              <div className="space-y-3">
                                <ScoreBar label="Clarity" score={typeof displayJudge.clarity_score === 'number' ? displayJudge.clarity_score : 0} icon={<FiEye className="w-3.5 h-3.5" />} />
                                <ScoreBar label="Originality" score={typeof displayJudge.originality_score === 'number' ? displayJudge.originality_score : 0} icon={<FiStar className="w-3.5 h-3.5" />} />
                                <ScoreBar label="Authority" score={typeof displayJudge.authority_score === 'number' ? displayJudge.authority_score : 0} icon={<FiAward className="w-3.5 h-3.5" />} />
                                <ScoreBar label="Authenticity" score={typeof displayJudge.authenticity_score === 'number' ? displayJudge.authenticity_score : 0} icon={<FiShield className="w-3.5 h-3.5" />} />
                                <ScoreBar label="Engagement" score={typeof displayJudge.engagement_potential_score === 'number' ? displayJudge.engagement_potential_score : 0} icon={<FiTrendingUp className="w-3.5 h-3.5" />} />
                              </div>

                              {/* Strengths */}
                              {Array.isArray(displayJudge.strengths) && displayJudge.strengths.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FiCheck className="w-3.5 h-3.5" /> Strengths
                                  </p>
                                  <div className="space-y-1.5">
                                    {displayJudge.strengths.map((s, i) => (
                                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-emerald-950/30 border border-emerald-900/30">
                                        <FiCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-slate-300">{s ?? ''}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Improvement Notes */}
                              {Array.isArray(displayJudge.improvement_notes) && displayJudge.improvement_notes.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FiAlertCircle className="w-3.5 h-3.5" /> Improvements
                                  </p>
                                  <div className="space-y-1.5">
                                    {displayJudge.improvement_notes.map((note, i) => (
                                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-950/20 border border-amber-900/30">
                                        <FiAlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-slate-300">{note ?? ''}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            SCHEDULE MANAGEMENT SCREEN
            ===================================================== */}
        {activeScreen === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Schedule Management</h2>
                <p className="text-slate-400 mt-1">Manage automated content generation schedule</p>
              </div>
              <Button onClick={fetchScheduleData} disabled={scheduleLoading} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
                <FiRefreshCw className={`w-4 h-4 ${scheduleLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Schedule Action Messages */}
            {scheduleActionMsg && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-300 text-sm">
                <FiCheck className="w-4 h-4 flex-shrink-0" />
                <span>{scheduleActionMsg}</span>
              </div>
            )}
            {scheduleError && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 text-sm">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Schedule Card */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="bg-slate-900/60 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-blue-400" />
                      Content Orchestrator Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {scheduleLoading && !schedule ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-700 rounded w-1/2" />
                        <div className="h-4 bg-slate-700 rounded w-3/4" />
                        <div className="h-4 bg-slate-700 rounded w-2/3" />
                      </div>
                    ) : schedule ? (
                      <>
                        {/* Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Status</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${schedule.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            <span className={`text-sm font-medium ${schedule.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {schedule.is_active ? 'Active' : 'Paused'}
                            </span>
                          </div>
                        </div>

                        {/* Frequency */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Frequency</span>
                          <span className="text-sm text-white font-medium">
                            {schedule.cron_expression ? cronToHuman(schedule.cron_expression) : 'N/A'}
                          </span>
                        </div>

                        {/* Cron Expression */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Cron</span>
                          <code className="text-xs bg-slate-800 px-2 py-1 rounded text-blue-300 font-mono">{schedule.cron_expression ?? 'N/A'}</code>
                        </div>

                        {/* Timezone */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Timezone</span>
                          <span className="text-sm text-slate-300">{schedule.timezone ?? 'UTC'}</span>
                        </div>

                        <Separator className="bg-slate-800" />

                        {/* Next Run */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Next Run</span>
                          <span className="text-xs text-slate-300">{formatTimestamp(schedule.next_run_time)}</span>
                        </div>

                        {/* Last Run */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Last Run</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300">{formatTimestamp(schedule.last_run_at)}</span>
                            {schedule.last_run_success !== null && (
                              <div className={`w-2 h-2 rounded-full ${schedule.last_run_success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            )}
                          </div>
                        </div>

                        <Separator className="bg-slate-800" />

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button onClick={handleToggleSchedule} disabled={scheduleLoading} variant="outline" className={`flex-1 gap-2 text-sm ${schedule.is_active ? 'border-amber-700/50 text-amber-300 hover:bg-amber-900/20' : 'border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/20'}`}>
                            {schedule.is_active ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                            {schedule.is_active ? 'Pause' : 'Resume'}
                          </Button>
                          <Button onClick={handleTriggerNow} disabled={scheduleLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
                            <FiZap className="w-4 h-4" />
                            Trigger Now
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        <FiClock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-sm">No schedule data available</p>
                        <Button onClick={fetchScheduleData} variant="outline" className="mt-3 border-slate-700 text-slate-400 text-xs">
                          Retry
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Agent Status */}
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>

              {/* Execution History */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-900/60 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <FiActivity className="w-4 h-4 text-blue-400" />
                      Execution History
                    </CardTitle>
                    <CardDescription className="text-slate-500">Recent scheduled runs and their results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scheduleLogs.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <FiActivity className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm">No execution logs available</p>
                        <p className="text-xs text-slate-600 mt-1">Logs will appear after the schedule runs</p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[500px]">
                        <div className="space-y-2">
                          {scheduleLogs.map((log) => (
                            <div key={log.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${log.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                  <span className={`text-xs font-medium ${log.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {log.success ? 'Success' : 'Failed'}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500">{formatTimestamp(log.executed_at)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>Attempt {log.attempt ?? 1}/{log.max_attempts ?? 1}</span>
                                {log.response_status ? <span>Status: {log.response_status}</span> : null}
                              </div>
                              {log.error_message && (
                                <p className="text-xs text-red-400 mt-2 p-2 rounded bg-red-950/20 border border-red-900/20">{log.error_message}</p>
                              )}
                              {log.response_output && (
                                <div className="mt-2">
                                  <p className="text-xs text-slate-400 line-clamp-2">{(log.response_output ?? '').slice(0, 200)}{(log.response_output ?? '').length > 200 ? '...' : ''}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
