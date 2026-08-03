/* ══════════════════════════════════════════════════
   Nine shipped projects - the single source of truth.
   The work grid, all nine decks, prev/next, the
   sitemap and the prerender route list derive from
   this array. Order is computed, never hand-kept.
   ══════════════════════════════════════════════════ */

export const PROJECTS = [
  /* ───────────────────────────────── mitsu ── */
  {
    slug:     'mitsu',
    name:     'Mitsu',
    kanji:    '見つ',
    tagline:  'Touchless window control for Windows',
    event:    'OpenAI Build Week - Apps for Your Life',
    role:     'Solo Developer',
    duration: '8 days',
    period:   { start: '2026-07', end: '2026-07' },
    award:    null,
    chips:    ['Python', 'MediaPipe', 'GPT-5.6'],

    summary:
      'A hands-free Windows window manager combining webcam hand tracking, voice commands and ' +
      'direct Win32 window control. Point at nothing, say a name, and your windows move - pinch ' +
      'a window on one monitor, slide your hand, and watch it glide to the other.',

    stats: [
      { num: '21-pt', lbl: 'Hand landmark model' },
      { num: '100',   lbl: 'Automated tests' },
      { num: 'Mixed', lbl: 'DPI monitor layouts' },
      { num: '0',     lbl: 'Camera frames uploaded' },
    ],

    highlights: [
      { headline: 'Hands-free Windows window manager',
        body: 'Combines webcam hand tracking, voice commands and direct Win32 window control into one desktop layer.',
        tech: 'MediaPipe · pywin32' },
      { headline: 'Gesture-based repositioning across monitors',
        body: 'Window repositioning for single- and multi-monitor desktops, including mixed-DPI layouts and cross-screen movement.',
        tech: 'Mixed-DPI virtual desktop geometry' },
      { headline: 'Deterministic gesture state machine',
        body: 'Physical-pixel pointer control, two-fingertip click, browser navigation gestures, minimize, maximize and minimized-window shelf interactions.',
        tech: 'One Euro filtering · OpenCV' },
      { headline: 'Push-to-talk voice commands',
        body: 'OpenAI transcription drives window lookup, restore, target locking and destination-based window relocation.',
        tech: 'OpenAI transcription' },
      { headline: 'Perceive → reason → act architecture',
        body: 'Local hand-control processing, a bounded GPT-5.6 function-calling adapter, a circuit breaker and an emergency kill switch.',
        tech: 'GPT-5.6 Responses API' },
      { headline: 'Verified end to end',
        body: '100 passing tests, Ruff checks, Black formatting checks, model-integrity validation and safety controls for desktop actions.',
        tech: 'pytest · Ruff · Black' },
    ],

    architecture: [
      { stage: 'Perceive', accent: 'cyan',    name: 'Local hand + voice capture',
        detail: 'MediaPipe hand landmarker and push-to-talk audio, processed entirely on-device. No camera frames leave the machine.' },
      { stage: 'Reason',   accent: 'violet',  name: 'Bounded function-calling adapter',
        detail: 'A GPT-5.6 Responses API adapter with a fixed tool surface, circuit breaker and strict output bounds.' },
      { stage: 'Act',      accent: 'emerald', name: 'Direct Win32 window control',
        detail: 'Deterministic state machine drives pywin32 against physical-pixel geometry, behind an emergency kill switch.' },
    ],

    stack: [
      { category: 'Core Languages', items: [{ name: 'Python', ver: '3.12' }, { name: 'TypeScript' }] },
      { category: 'AI & SDKs', items: [
        { name: 'OpenAI transcription' },
        { name: 'GPT-5.6 Responses API', role: 'function calling' },
        { name: 'Codex' }] },
      { category: 'Computer Vision', items: [
        { name: 'MediaPipe Hand Landmarker' }, { name: 'OpenCV' }, { name: 'One Euro filtering' }] },
      { category: 'Desktop Control', items: [
        { name: 'pywin32' }, { name: 'Mixed-DPI desktop geometry' }, { name: 'PySide6' }] },
      { category: 'Development Ecosystem', items: [
        { name: 'pytest' }, { name: 'Ruff' }, { name: 'Black' },
        { name: 'React' }, { name: 'Vite' }, { name: 'Tailwind CSS' }, { name: 'Vercel' }] },
    ],

    media: [
      { src: 'walkthrough.png', cap: 'Mitsu walkthrough', ratio: '16/9' },
      { yt: 'l7jBbqcaIGA',      cap: 'Video presentation' },
      { src: 'gestures.png',    cap: 'Gesture state machine', ratio: '16/9' },
      { src: 'multimonitor.png',cap: 'Cross-monitor relocation', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo',  label: 'Walkthrough', url: 'https://mitsu-iota.vercel.app/', primary: true },
      { kind: 'repo',  label: 'Repository',  url: 'https://github.com/Mizunandayo/mitsu' },
      { kind: 'video', label: 'Presentation',url: 'https://youtu.be/l7jBbqcaIGA' },
      { kind: 'devpost', label: 'DevPost',
        url: 'https://devpost.com/software/mitsu-hand-and-voice-gesture-control-for-the-desktop' },
    ],
  },

  /* ──────────────────────────────── minari ── */
  {
    slug:     'minari',
    name:     'Minari',
    kanji:    '実成',
    tagline:  'Autonomous flaky-test resolution for GitLab',
    event:    'Google Cloud Rapid Agent Hackathon - GitLab',
    role:     'Solo Developer',
    duration: '8 days',
    period:   { start: '2026-05', end: '2026-06' },
    award:    null,
    chips:    ['LangGraph', 'Gemini 2.5', 'Cloud Run'],

    summary:
      'An autonomous agent that detects, diagnoses, repairs, verifies and submits merge requests ' +
      'for flaky tests in GitLab repositories - a full agentic loop from probabilistic detection ' +
      'through CI verification to a reviewable MR.',

    stats: [
      { num: '2',    lbl: 'Cost-aware model tiers' },
      { num: 'SSE',  lbl: 'Live agent reasoning' },
      { num: 'AST',  lbl: 'Assertion-safe patching' },
      { num: '8',    lbl: 'Days, solo' },
    ],

    highlights: [
      { headline: 'Autonomous detect → repair → submit loop',
        body: 'Detects, diagnoses, repairs, verifies and submits merge requests for flaky tests in GitLab repositories without human intervention.',
        tech: 'LangGraph · GitLab MCP' },
      { headline: 'End-to-end agentic workflow',
        body: 'Combines probabilistic flakiness detection, root cause analysis, automated code generation, CI verification and merge request creation.',
        tech: 'LangGraph' },
      { headline: 'Cost-aware AI routing',
        body: 'Dynamically selects Gemini 2.5 Flash or Gemini 2.5 Pro based on flakiness complexity while tracking inference costs in real time.',
        tech: 'Gemini 2.5 Flash / Pro' },
      { headline: 'Deterministic code validation',
        body: 'tree-sitter preserves test assertions and prevents unsafe code modifications before automated verification runs.',
        tech: 'tree-sitter' },
      { headline: 'Scalable cloud architecture',
        body: 'Google Cloud Run, PostgreSQL, Redis and Server-Sent Events deliver real-time agent reasoning and verification progress.',
        tech: 'Cloud Run · pgvector · Upstash Redis' },
    ],

    architecture: [
      { stage: 'Detect',  accent: 'cyan',    name: 'Probabilistic flakiness detection',
        detail: 'Scores test histories to separate genuine failures from non-deterministic ones before any model is invoked.' },
      { stage: 'Reason',  accent: 'violet',  name: 'Root cause analysis + routing',
        detail: 'Cost-aware router picks Gemini 2.5 Flash or Pro by complexity, tracking inference spend per run.' },
      { stage: 'Validate',accent: 'emerald', name: 'tree-sitter assertion guard',
        detail: 'Deterministic AST pass rejects any patch that would weaken or remove a test assertion.' },
      { stage: 'Verify',  accent: 'blue',    name: 'CI run + merge request',
        detail: 'Runs the repaired test in CI, then opens a reviewable merge request with the diagnosis attached.' },
    ],

    stack: [
      { category: 'Core Languages', items: [{ name: 'Python', ver: '3.12' }, { name: 'TypeScript' }] },
      { category: 'AI & SDKs', items: [
        { name: 'LangGraph' }, { name: 'Gemini 2.5 Pro' }, { name: 'Gemini 2.5 Flash' },
        { name: 'gemini-embedding-001' }, { name: 'MCP Adapters' }] },
      { category: 'Backend & Infrastructure', items: [
        { name: 'FastAPI' }, { name: 'PostgreSQL' }, { name: 'pgvector' },
        { name: 'Upstash Redis' }, { name: 'Google Cloud Run' }, { name: 'Docker' },
        { name: 'Secret Manager' }] },
      { category: 'Development Ecosystem', items: [
        { name: 'Next.js', ver: '16' }, { name: 'React', ver: '19' },
        { name: 'Tailwind CSS', ver: 'v4' }, { name: 'GitLab MCP' },
        { name: 'tree-sitter' }, { name: 'Server-Sent Events' }] },
    ],

    media: [
      { src: 'app.png',       cap: 'Agent run view', ratio: '16/9' },
      { yt: 'ndJ8cZIg4cM',    cap: 'Video presentation' },
      { src: 'reasoning.png', cap: 'Live reasoning stream', ratio: '16/9' },
      { src: 'mr.png',        cap: 'Generated merge request', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo',    label: 'Web App',      url: 'https://minari-eight.vercel.app/', primary: true },
      { kind: 'repo',    label: 'Repository',   url: 'https://github.com/Mizunandayo/minari' },
      { kind: 'video',   label: 'Presentation', url: 'https://www.youtube.com/watch?v=ndJ8cZIg4cM' },
      { kind: 'devpost', label: 'DevPost',      url: 'https://devpost.com/software/minari-autonomous-flaky-test-resolution-for-gitlab' },
    ],
  },

  /* ──────────────────────────────── misaki ── */
  {
    slug:     'misaki',
    name:     'Misaki',
    kanji:    '見先',
    tagline:  'AI legislative intelligence platform',
    event:    'Web Data UNLOCKED - Security & Compliance + AI/ML API',
    role:     'Solo Developer',
    duration: '7 days',
    period:   { start: '2026-05', end: '2026-06' },
    award:    null,
    chips:    ['Bright Data', 'LangGraph', 'pgvector'],

    summary:
      'An AI-powered platform that analyses regulatory risk across all 50 U.S. states, the EU and ' +
      'the UK, turning live web data into company-specific compliance insight - impact estimates, ' +
      'pass probability and financial exposure.',

    stats: [
      { num: '52',   lbl: 'Jurisdictions tracked' },
      { num: '4',    lbl: 'Live data sources' },
      { num: 'Multi',lbl: 'Provider AI gateway' },
      { num: '7',    lbl: 'Days, solo' },
    ],

    highlights: [
      { headline: 'Regulatory risk across 52 jurisdictions',
        body: 'Analyses all 50 U.S. states, the EU and the UK, delivering company-specific compliance insight from live web data.',
        tech: 'Bright Data Web Unlocker · SERP API' },
      { headline: 'Multi-source AI pipeline',
        body: 'Aggregates SEC filings, news, legislative documents and lobbyist disclosures to estimate regulatory impact, pass probability and financial exposure.',
        tech: 'Web Scraper API · Scraping Browser' },
      { headline: 'Agentic report generation',
        body: 'A LangGraph workflow autonomously generates lobbyist briefs, recommends legal counsel and produces board-ready compliance reports.',
        tech: 'LangGraph · WeasyPrint' },
      { headline: 'Provider-agnostic AI gateway',
        body: 'Capability-based model routing with fallback mechanisms, cost tracking and spend controls for reliable large-scale inference.',
        tech: 'AI/ML API · Gemini · Langfuse' },
      { headline: 'Scalable cloud architecture',
        body: 'Bright Data APIs, PostgreSQL with pgvector, Redis caching and real-time event streaming for responsive compliance intelligence.',
        tech: 'Supabase · Redis · Railway' },
    ],

    architecture: [
      { stage: 'Collect', accent: 'cyan',    name: 'Live web data aggregation',
        detail: 'Bright Data MCP Server, Web Unlocker, SERP API and Scraping Browser pull filings, news, bills and disclosures.' },
      { stage: 'Ground',  accent: 'blue',    name: 'Vector store + retrieval',
        detail: 'PostgreSQL with pgvector grounds every claim in a retrievable source document.' },
      { stage: 'Reason',  accent: 'violet',  name: 'Agentic analysis workflow',
        detail: 'LangGraph estimates impact, pass probability and exposure, then drafts briefs and counsel recommendations.' },
      { stage: 'Deliver', accent: 'emerald', name: 'Board-ready report generation',
        detail: 'WeasyPrint renders compliance reports; the AI gateway enforces cost ceilings across the run.' },
    ],

    stack: [
      { category: 'Core Languages', items: [{ name: 'TypeScript' }, { name: 'Python', ver: '3.12' }] },
      { category: 'Web Data', items: [
        { name: 'Bright Data MCP Server' }, { name: 'Web Unlocker' }, { name: 'SERP API' },
        { name: 'Web Scraper API' }, { name: 'Scraping Browser' }] },
      { category: 'AI & SDKs', items: [
        { name: 'AI/ML API', role: 'GPT-4o Mini · 4.1 · Vision' }, { name: 'Gemini' },
        { name: 'LangGraph' }, { name: 'LangChain' }, { name: 'Langfuse' }] },
      { category: 'Data & Infrastructure', items: [
        { name: 'Next.js', ver: '16' }, { name: 'FastAPI' }, { name: 'PostgreSQL', role: 'pgvector' },
        { name: 'Supabase' }, { name: 'Redis' }, { name: 'WeasyPrint' },
        { name: 'Vercel' }, { name: 'Railway' }, { name: 'Docker' }] },
    ],

    media: [
      { src: 'app.png',       cap: 'Misaki web app', ratio: '16/9' },
      { yt: 'rVXMIxTKRq0',    cap: 'Video presentation' },
      { src: 'riskmap.png',   cap: 'Jurisdiction risk map', ratio: '16/9' },
      { src: 'report.png',    cap: 'Generated compliance report', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo',  label: 'Web App',      url: 'https://misaki-phi.vercel.app/', primary: true },
      { kind: 'repo',  label: 'Repository',   url: 'https://github.com/Mizunandayo/misaki' },
      { kind: 'video', label: 'Presentation', url: 'https://www.youtube.com/watch?v=rVXMIxTKRq0' },
      { kind: 'submission', label: 'lablab.ai',
        url: 'https://lablab.ai/ai-hackathons/brightdata-ai-agents-web-data-hackathon/mizu/misaki-ai-legislative-intelligence-platform' },
    ],
  },

  /* ───────────────────────────────── mirai ── */
  {
    slug:     'mirai',
    name:     'Mirai',
    kanji:    'ミライ',
    tagline:  'AI-powered robot arm simulator',
    event:    'Transforming Enterprise Through AI - Robotics & Simulation',
    role:     'Solo Developer',
    duration: '8 days',
    period:   { start: '2026-05', end: '2026-05' },
    award:    null,
    chips:    ['React Three Fiber', 'Rapier WASM', 'MuJoCo'],

    summary:
      'A browser-based robotics platform that turns natural-language instructions into verified ' +
      'robot arm motion plans - no programming required - then exports the result to real ' +
      'hardware in one click.',

    stats: [
      { num: '60',  lbl: 'FPS browser physics' },
      { num: '4',   lbl: 'Hardware export formats' },
      { num: '2',   lbl: 'Physics engines' },
      { num: '8',   lbl: 'Days, solo' },
    ],

    highlights: [
      { headline: 'Natural language to verified motion',
        body: 'Transforms natural-language instructions into verified robot arm motion plans without requiring programming knowledge.',
        tech: 'Gemini 2.5 Flash' },
      { headline: 'Intent → spec → simulation pipeline',
        body: 'Converts user intent into structured task specifications, validates execution and generates real-time physics simulations at 60 FPS.',
        tech: 'React Three Fiber · Rapier WASM' },
      { headline: 'Neuro-symbolic safety architecture',
        body: 'Pairs Gemini 2.5 Flash with deterministic safety validation to ensure reliable and verifiable robot motion planning.',
        tech: 'Deterministic validator' },
      { headline: 'One-click hardware export',
        body: 'Supports Arduino, Python, URDF and bill-of-materials generation, enabling a clean transition from simulation to physical robots.',
        tech: 'Jinja2 templating' },
      { headline: 'Hybrid simulation architecture',
        body: 'Rapier WASM for real-time browser physics, MuJoCo for backend validation, accuracy analysis and hardware feasibility.',
        tech: 'Rapier WASM · MuJoCo 3.x' },
    ],

    architecture: [
      { stage: 'Interpret', accent: 'cyan',    name: 'Natural language → task spec',
        detail: 'Gemini 2.5 Flash converts a plain-language instruction into a structured, typed task specification.' },
      { stage: 'Validate',  accent: 'emerald', name: 'Deterministic safety pass',
        detail: 'Symbolic validator rejects unreachable, unsafe or kinematically invalid plans before anything renders.' },
      { stage: 'Simulate',  accent: 'blue',    name: 'Dual-engine physics',
        detail: 'Rapier WASM runs the plan in-browser at 60 FPS; MuJoCo 3.x re-validates it server-side for hardware feasibility.' },
      { stage: 'Export',    accent: 'violet',  name: 'Hardware handoff',
        detail: 'Emits Arduino, Python, URDF and a bill of materials from the same verified plan.' },
    ],

    /* Grouped the way the runtime actually divides: what plans, what
       simulates, what ships. The old three-bucket split had Rapier in
       two of them and said nothing about the kinematics or the export
       path. */
    stack: [
      { category: 'Inference', note: 'ReAct planning, with a deterministic validation pass behind it.', items: [
        { name: 'Gemini 2.5 Flash',  role: 'planning · ReAct' },
        { name: 'Gemini 2.0 Flash',  role: 'fallback chain' },
        { name: 'MuJoCo', ver: '3.x', role: 'validation' }] },

      { category: 'Simulation & Physics', note: 'Client simulation at 60fps, server-side validation.', items: [
        { name: 'Rapier WASM',       role: 'realtime sim' },
        { name: 'Three.js',          role: '3D engine' },
        { name: 'React Three Fiber', role: '3D engine' },
        { name: 'FABRIK',            role: 'IK solver' },
        { name: 'Forward Kinematics',role: 'FK solver' },
        { name: 'Motion Compiler',   role: 'motion' },
        { name: 'React Flow', ver: '12', role: 'task graph' },
        { name: 'Jotai',             role: 'state' },
        { name: 'Python',            role: 'language' }] },

      { category: 'Application', items: [
        { name: 'React', ver: '18',  role: 'frontend' },
        { name: 'TypeScript',        role: 'frontend' },
        { name: 'FastAPI',           role: 'backend' },
        { name: 'Jinja2',            role: 'export' },
        { name: 'Vercel',            role: 'deploy' },
        { name: 'Railway',           role: 'deploy' },
        { name: 'Docker',            role: 'container' },
        { name: 'SQLite',            role: 'storage' }] },
    ],

    media: [
      { src: 'app.png',      cap: 'Mirai web app', ratio: '16/9' },
      { yt: 'aVDTUfj3qAQ',   cap: 'Demo video' },
      { src: 'sim.png',      cap: 'Browser physics simulation', ratio: '16/9' },
      { src: 'export.png',   cap: 'Hardware export', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo',  label: 'Walkthrough', url: 'https://mirai-tech-ex-hackathon-transformin-snowy.vercel.app/', primary: true },
      { kind: 'demo',  label: 'Web App',     url: 'https://mirai-tech-ex-hackathon-transformin.vercel.app/' },
      { kind: 'repo',  label: 'Repository',  url: 'https://github.com/Mizunandayo/mirai' },
      { kind: 'video', label: 'Demo',        url: 'https://www.youtube.com/watch?v=aVDTUfj3qAQ' },
      { kind: 'submission', label: 'lablab.ai',
        url: 'https://lablab.ai/ai-hackathons/techex-intelligent-enterprise-solutions-hackathon/mizu/mirai-ai-powered-robot-arm-simulator' },
    ],
  },

  /* ────────────────────────────────── miwa ── */
  {
    slug:     'miwa',
    name:     'Miwa',
    kanji:    '美話',
    tagline:  'Real-time Japanese voice translation for Discord',
    event:    'AMD Developer Hackathon 2026 - AI Agents & Agentic Workflows',
    role:     'Solo Developer',
    duration: '7 days',
    period:   { start: '2026-05', end: '2026-05' },
    award:    null,
    chips:    ['Tauri v2', 'vLLM', 'Llama 3.3 70B'],

    summary:
      'An always-on-top desktop overlay that translates Japanese voice in real time during Discord ' +
      'calls, with a two-pass architecture that shows a fast translation first and refines it a ' +
      'moment later.',

    stats: [
      { num: '2-pass', lbl: 'Translation architecture' },
      { num: '70B',    lbl: 'Llama 3.3 on MI300X' },
      { num: 'Multi',  lbl: 'Agent reply pipeline' },
      { num: '7',      lbl: 'Days, solo' },
    ],

    highlights: [
      { headline: 'Always-on-top translation overlay',
        body: 'A desktop overlay for real-time Japanese voice translation during Discord calls, sitting above every other window.',
        tech: 'Tauri v2 · React' },
      { headline: 'End-to-end voice AI pipeline',
        body: 'Integrates voice capture, Whisper transcription, translation, contextual AI reply generation and Discord bot delivery.',
        tech: 'Whisper · discord.js' },
      { headline: 'Two-pass translation architecture',
        body: 'Delivers a fast initial translation followed by an AI-refined response, cutting perceived latency substantially.',
        tech: 'vLLM' },
      { headline: 'Multi-agent reply suggestions',
        body: 'A CrewAI-style agent pipeline generates natural, context-aware replies rather than literal translations.',
        tech: 'CrewAI-style pipeline · Qdrant' },
      { headline: 'Optimised for AMD MI300X',
        body: 'Deployed on AMD Developer Cloud using vLLM and Llama 3.3 70B for efficient real-time inference.',
        tech: 'AMD MI300X · vLLM' },
    ],

    architecture: [
      { stage: 'Capture',   accent: 'cyan',    name: 'Voice capture from call audio',
        detail: 'Taps Discord call audio and segments it for streaming transcription.' },
      { stage: 'Transcribe',accent: 'blue',    name: 'Whisper + fast first pass',
        detail: 'OpenAI Whisper transcribes; a fast translation renders immediately so the overlay never sits empty.' },
      { stage: 'Refine',    accent: 'violet',  name: 'Llama 3.3 70B second pass',
        detail: 'vLLM on MI300X refines the translation and a multi-agent pipeline drafts context-aware replies.' },
      { stage: 'Deliver',   accent: 'emerald', name: 'Overlay + Discord bot',
        detail: 'Results stream to the always-on-top overlay over WebSocket and back into the call via discord.js.' },
    ],

    stack: [
      { category: 'Core Languages', items: [
        { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'Python' },
        { name: 'HTML' }, { name: 'CSS' }] },
      { category: 'Development Ecosystem', items: [
        { name: 'React' }, { name: 'Tauri', ver: 'v2' }, { name: 'Vite' },
        { name: 'Jotai' }, { name: 'FastAPI' }, { name: 'discord.js' }] },
      { category: 'Data & Infrastructure', items: [
        { name: 'SQLite' }, { name: 'Qdrant' }, { name: 'Docker' }, { name: 'WebSocket' },
        { name: 'AMD Developer Cloud', role: 'MI300X' }] },
      { category: 'AI & SDKs', items: [
        { name: 'vLLM' }, { name: 'Llama 3.3 70B' }, { name: 'OpenAI Whisper' },
        { name: 'CrewAI-style pipeline' }, { name: 'Edge-TTS' }, { name: 'pykakasi' }] },
    ],

    /* Video second, so it leads the gallery - the same order mitsu,
       minari, misaki and mirai use. It was last here, which put the
       presentation at the end of the row instead of the front. */
    media: [
      { src: 'overlay.png',     cap: 'Miwa translation overlay', ratio: '16/9' },
      { yt:  'jZzCQzYThZE',     cap: 'Video presentation' },
      { src: 'walkthrough.png', cap: 'Miwa walkthrough', ratio: '16/9' },
      { src: 'replies.png',     cap: 'Agent reply suggestions', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo',  label: 'Walkthrough',  url: 'https://mizunandayo.github.io/miwa/', primary: true },
      { kind: 'repo',  label: 'Repository',   url: 'https://github.com/Mizunandayo/miwa' },
      { kind: 'video', label: 'Presentation', url: 'https://www.youtube.com/watch?v=jZzCQzYThZE' },
      { kind: 'submission', label: 'lablab.ai',
        url: 'https://lablab.ai/ai-hackathons/amd-developer/miwa/miwa-real-time-japanese-discord-voice-translator' },
    ],
  },

  /* ──────────────────────────────── bacsal ── */
  {
    slug:     'bacsal',
    name:     'Bacsal Consultancy',
    kanji:    '事務',
    tagline:  'Business management & CMS platform',
    event:    'Internship - Lead Junior Software Engineer',
    role:     'Lead Junior Software Engineer',
    duration: '4 months',
    period:   { start: '2026-01', end: '2026-04' },
    award:    null,
    chips:    ['Next.js 16', 'Prisma 7', 'NextAuth v5'],

    summary:
      'A full-stack business consultancy CMS with a role-based dashboard managing twelve-plus ' +
      'content entities, a dynamic quotation system with PDF generation, and real-time audit ' +
      'logging across 72+ tracked actions. Built and shipped during a four-month internship.',

    stats: [
      { num: '12+', lbl: 'Content entities' },
      { num: '72+', lbl: 'Audited actions' },
      { num: '3',   lbl: 'Permission roles' },
      { num: 'SSE', lbl: 'Live admin dashboard' },
    ],

    highlights: [
      { headline: 'Role-based CMS across 12+ entities',
        body: 'SUPERADMIN / ADMIN / STAFF dashboard managing blog with rich text and media blocks, services, team, testimonials, FAQs, hiring, quotations, milestones, missions, visions, core values and strategic outlooks.',
        tech: 'Next.js 16 · Prisma 7' },
      { headline: 'Quotation system with PDF delivery',
        body: 'Dynamic pricing, drag-and-drop service management, Puppeteer PDF generation and automated email delivery.',
        tech: 'Puppeteer · Nodemailer' },
      { headline: 'Real-time admin dashboard',
        body: 'SSE-powered audit logging across 72+ tracked actions, IMAP email sync for leads and inquiries, and Cloudinary media management.',
        tech: 'Server-Sent Events · Cloudinary' },
      { headline: 'Hardened authentication',
        body: 'NextAuth JWT sessions, CSRF protection, Upstash Redis rate limiting, XSS sanitisation, Valibot validation and strict CSP/HSTS headers.',
        tech: 'NextAuth v5 · Valibot · Upstash' },
      { headline: 'Advanced media handling',
        body: 'Signed direct Cloudinary uploads preserving original filenames, video uploads and privacy-enhanced YouTube embeds.',
        tech: 'Cloudinary signed uploads' },
      { headline: 'Public API with caching',
        body: 'Stale-while-revalidate caching, hiring job postings and applications with status tracking, plus AI chatbot integration.',
        tech: 'SWR caching' },
      { headline: 'Animated, responsive frontend',
        body: 'Framer Motion and GSAP animation, reusable shadcn/ui components and a mobile-first responsive layout.',
        tech: 'Framer Motion · GSAP · shadcn/ui' },
    ],

    stack: [
      { category: 'Core Languages', items: [
        { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'HTML' }, { name: 'CSS' }] },
      { category: 'Development Ecosystem', items: [
        { name: 'React', ver: '19' }, { name: 'Next.js', ver: '16' },
        { name: 'Tailwind CSS', ver: 'v4' }, { name: 'shadcn/ui' },
        { name: 'Framer Motion' }, { name: 'GSAP' }, { name: 'Prisma ORM', ver: '7' },
        { name: 'NextAuth', ver: 'v5' }, { name: 'Node.js' }, { name: 'Valibot' },
        { name: 'Vitest' }, { name: 'Puppeteer' }, { name: 'Nodemailer' }] },
      { category: 'Data & Infrastructure', items: [
        { name: 'PostgreSQL', role: 'Supabase' }, { name: 'Redis', role: 'Upstash' },
        { name: 'Cloudinary' }, { name: 'Vercel' }] },
      { category: 'Tools & Version Control', items: [
        { name: 'Git' }, { name: 'GitHub' }, { name: 'ESLint' }, { name: 'Postman' }] },
    ],

    media: [
      { src: 'home.png',    cap: 'Bacsal Business Consultancy', ratio: '16/9' },
      { src: 'contact.png', cap: 'Contact page', ratio: '16/9' },
      { src: 'team.png',    cap: 'Team page', ratio: '16/9' },
      { src: 'admin.png',   cap: 'Admin dashboard', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo', label: 'Live Site', url: 'https://www.bacsalbusinessconsultancy.com/', primary: true },
    ],
  },

  /* ─────────────────────── galactic-conquest ── */
  {
    slug:     'galactic-conquest',
    name:     'Galactic Conquest',
    kanji:    '宇宙',
    tagline:  'Web3 mining strategy game',
    event:    'RAITE 2025 Hackathon Programming Competition',
    role:     'UI/UX & Frontend Developer',
    duration: 'Oct 2025',
    period:   { start: '2025-10', end: '2025-10' },
    award:    '🥉 2nd Runner-Up',
    chips:    ['Next.js', 'Farcaster SDK', 'Smart Contracts'],

    summary:
      'A Web3 mining-themed strategy game with PvP combat and skill-based progression, built for a ' +
      'national-level hackathon. Placed 2nd Runner-Up among competing teams.',

    stats: [
      { num: '🥉',   lbl: '2nd Runner-Up, RAITE 2025' },
      { num: 'PvP',  lbl: 'Combat + progression' },
      { num: 'On-chain', lbl: 'Verifiable actions' },
    ],

    highlights: [
      { headline: '2nd Runner-Up at national level',
        body: 'Placed third among competing teams at the RAITE 2025 Hackathon Programming Competition.',
        tech: 'RAITE 2025' },
      { headline: 'Web3 mining strategy game',
        body: 'Designed and developed a mining-themed strategy game featuring PvP combat and skill-based progression.',
        tech: 'Next.js · shadcn/ui' },
      { headline: 'Mine-to-earn token economics',
        body: 'Implemented sustainable token economics with multiple token sinks to maintain healthy circulation.',
        tech: 'Smart Contracts' },
      { headline: 'Decay mechanics',
        body: 'Encouraged active gameplay by discouraging inactivity and resource hoarding.',
        tech: 'Game systems design' },
      { headline: 'On-chain interactions',
        body: 'Enabled transparent and verifiable gameplay actions using blockchain technology.',
        tech: 'Farcaster SDK · MiniKit' },
      { headline: 'Responsive interactive UI',
        body: 'Delivered a smooth user experience across devices using modern frontend tooling.',
        tech: 'React · Tailwind CSS' },
    ],

    stack: [
      { category: 'Core Languages', items: [
        { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'HTML' }, { name: 'CSS' }] },
      { category: 'Development Ecosystem', items: [
        { name: 'React' }, { name: 'Next.js' }, { name: 'shadcn/ui' }] },
      { category: 'Data & Infrastructure', items: [
        { name: 'LocalStorage' }, { name: 'APIs' }, { name: 'Smart Contracts' }] },
      { category: 'Web3 & SDKs', items: [{ name: 'Farcaster SDK' }, { name: 'MiniKit' }] },
    ],

    media: [
      { src: 'dashboard.png', cap: 'Galactic strategy dashboard', ratio: '16/9' },
      { src: 'troops.png',    cap: 'Troop dashboard', ratio: '16/9' },
      { src: 'award.png',     cap: '🥉 2nd Runner-Up - RAITE 2025', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo', label: 'Play',       url: 'https://galactic-conquest.onrender.com/', primary: true },
      { kind: 'repo', label: 'Repository', url: 'https://github.com/Mizunandayo/Galactic-Conquest---2nd-Runner-Up-Raite-Hackathon-October-17-2025' },
    ],
  },

  /* ───────────────────────────────── hirna ── */
  {
    slug:     'hirna',
    name:     'HirNa!',
    kanji:    '求人',
    tagline:  'Smart talent sourcing platform',
    event:    'Byteforward Hackathon - The Final Pitch',
    role:     'UI/UX & Frontend Developer · BPSU1 Team',
    duration: '5 months',
    period:   { start: '2025-06', end: '2025-10' },
    award:    '🥈 1st Runner-Up',
    chips:    ['Firebase', 'Google Maps API', 'Rev21 Labs'],

    summary:
      'An AI-powered job matching platform with a swipe-based discovery interface, employment ' +
      'heatmaps across North Luzon and a no-resume application flow. Placed 1st Runner-Up and ' +
      'advanced to the Final Pitch.',

    stats: [
      { num: '🥈',  lbl: '1st Runner-Up, Byteforward' },
      { num: 'Final',lbl: 'Advanced to Final Pitch' },
      { num: '0',   lbl: 'Resumes required' },
    ],

    highlights: [
      { headline: '1st Runner-Up and Final Pitch',
        body: 'Placed second among competing teams and advanced to the Final Pitch stage of the Byteforward Hackathon.',
        tech: 'Converge · Rev21 Labs' },
      { headline: 'Swipe-based job matching',
        body: 'A Tinder-like matching interface that simplifies job discovery and the application flow through swipe interactions.',
        tech: 'Vanilla JavaScript · Tailwind CSS' },
      { headline: 'Interactive employment heatmaps',
        body: 'Visualised employment opportunities across North Luzon using geolocation data.',
        tech: 'Google Maps · Places · Drawing Library' },
      { headline: 'No-resume application system',
        body: 'Streamlined hiring by enabling faster candidate–employer matching without a CV upload step.',
        tech: 'Cloud Firestore' },
      { headline: 'AI-powered chatbot',
        body: 'Real-time candidate assistance built on the Rev21 Labs API.',
        tech: 'Rev21 Labs API' },
      { headline: 'Sentiment and image analysis',
        body: 'Applied AI sentiment and image analysis to enhance candidate evaluation and overall user experience.',
        tech: 'Rev21Labs Sentiment Analysis API' },
    ],

    stack: [
      { category: 'Core Languages', items: [
        { name: 'JavaScript' }, { name: 'HTML' }, { name: 'CSS' }, { name: 'SCSS' }] },
      { category: 'Development Ecosystem', items: [
        { name: 'Vanilla JavaScript' }, { name: 'Tailwind CSS' }, { name: 'Node.js' },
        { name: 'Express' }, { name: 'Firebase Cloud Functions' }, { name: 'Axios' },
        { name: 'node-fetch' }, { name: 'CORS' }] },
      { category: 'Data & Infrastructure', items: [
        { name: 'Firebase Hosting' }, { name: 'Cloud Firestore' }, { name: 'Firebase Auth' },
        { name: 'Firebase Storage' }, { name: 'Firebase Analytics' },
        { name: 'Google Maps JS API' }, { name: 'Google Places API' },
        { name: 'Rev21Labs Sentiment API' }] },
      { category: 'Tools & Version Control', items: [
        { name: 'npm' }, { name: 'Tailwind CLI' }, { name: 'Nodemon' }, { name: 'ESLint' },
        { name: 'Firebase CLI' }, { name: 'Firebase Emulator Suite' },
        { name: 'Git' }, { name: 'GitHub' }] },
    ],

    media: [
      { src: 'app.png',     cap: 'HirNa! - Hire Talent. Here. Now.', ratio: '16/9' },
      { src: 'heatmap.png', cap: 'Employment heatmap', ratio: '16/9' },
      { src: 'award.png',   cap: '🥈 1st Runner-Up - Byteforward', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo', label: 'Live Site',  url: 'https://careerstep-bpsu1.web.app/index.html', primary: true },
      /* Team repository - owned by ArlynA47, not Mizunandayo. */
      { kind: 'repo', label: 'Repository', url: 'https://github.com/ArlynA47/bpsu1' },
    ],
  },

  /* ────────────────────────────── eye2wear ── */
  {
    slug:     'eye2wear',
    name:     'Eye2Wear',
    kanji:    '眼鏡',
    tagline:  'Optical clinic management system',
    event:    'Full-Stack Development',
    role:     'UI/UX & Full-Stack Developer',
    duration: '9 months',
    period:   { start: '2025-02', end: '2025-10' },
    award:    null,
    chips:    ['MongoDB', 'Socket.IO', 'Google OAuth'],

    summary:
      'A dual-clinic management system covering patient registration, appointment scheduling, ' +
      'inventory, orders and real-time patient–clinic messaging, with role-based access across ' +
      'Admin, Staff, Owner and Patient.',

    stats: [
      { num: '2',  lbl: 'Clinics supported' },
      { num: '4',  lbl: 'Permission roles' },
      { num: 'RT', lbl: 'Socket.IO messaging' },
      { num: '9',  lbl: 'Months' },
    ],

    highlights: [
      { headline: 'Dual-clinic management system',
        body: 'Supports Ambher Optical and Bautista Eye Center with patient registration, appointment scheduling and order management.',
        tech: 'React · Express · MongoDB' },
      { headline: 'Four-tier role-based access',
        body: 'Admin, Staff, Owner and Patient permission levels enforced across the platform.',
        tech: 'JWT' },
      { headline: 'Real-time messaging',
        body: 'Socket.IO-powered instant patient–clinic communication with image and document attachments.',
        tech: 'Socket.IO · Multer' },
      { headline: 'Automated notifications',
        body: 'Appointment reminders, order updates and restock alerts delivered via the PhilSMS API.',
        tech: 'PhilSMS API · Gmail API' },
      { headline: 'Inventory management',
        body: 'Category organisation, stock tracking and automated wishlist-based restock notifications.',
        tech: 'MongoDB Atlas' },
      { headline: 'Patient dashboard',
        body: 'Wishlist, order tracking, medical records and service browsing with Mapbox-powered location and directions.',
        tech: 'Mapbox' },
      { headline: 'Flexible secure authentication',
        body: 'JWT-based auth combined with Google OAuth for flexible and secure access.',
        tech: 'JWT · Google OAuth' },
      { headline: 'Analytics-driven admin dashboard',
        body: 'Visualised operational data with ApexCharts and Recharts alongside full account management.',
        tech: 'ApexCharts · Recharts' },
      { headline: 'Document generation',
        body: 'Receipts and reports generated with jsPDF, html2canvas and Puppeteer, stored on Cloudinary.',
        tech: 'jsPDF · html2canvas · Puppeteer' },
    ],

    stack: [
      { category: 'Core Languages', items: [
        { name: 'JavaScript' }, { name: 'HTML' }, { name: 'CSS' }] },
      { category: 'Development Ecosystem', items: [
        { name: 'React' }, { name: 'Vite' }, { name: 'Node.js' }, { name: 'Express.js' },
        { name: 'Tailwind CSS' }, { name: 'shadcn/ui' }, { name: 'Radix UI' },
        { name: 'Material UI' }, { name: 'Socket.IO' }, { name: 'Axios' }] },
      { category: 'Data & Infrastructure', items: [
        { name: 'MongoDB', role: 'Atlas' }, { name: 'Cloudinary' }] },
      { category: 'Authentication & APIs', items: [
        { name: 'JWT' }, { name: 'Google OAuth' }, { name: 'PhilSMS API' }, { name: 'Gmail API' }] },
      { category: 'Visualization & Utilities', items: [
        { name: 'ApexCharts' }, { name: 'Recharts' }, { name: 'jsPDF' },
        { name: 'html2canvas' }, { name: 'Puppeteer' }, { name: 'Multer' }] },
    ],

    media: [
      { src: 'app.png',         cap: 'Eye2Wear optical clinic', ratio: '16/9' },
      { src: 'appointment.png', cap: 'Appointment page', ratio: '16/9' },
      { src: 'team.png',        cap: 'Team page', ratio: '16/9' },
      { src: 'dashboard.png',   cap: 'Analytics dashboard', ratio: '16/9' },
    ],

    links: [
      { kind: 'demo', label: 'Live Site',  url: 'https://eye2wear.onrender.com', primary: true },
      { kind: 'repo', label: 'Repository', url: 'https://github.com/Mizunandayo/Eye2Wear---Optical-Clinic' },
    ],
  },
]

/* ── Derived helpers ───────────────────────────── */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Renders a `period` for display.
 *    same month        → 'July 2026'
 *    same year         → 'May – June 2026'
 *    spanning years    → 'November 2025 – February 2026'  */
export const formatPeriod = ({ start, end }) => {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  const from = MONTHS[sm - 1]
  const to = MONTHS[em - 1]

  if (sy === ey && sm === em) return `${from} ${sy}`
  if (sy === ey) return `${from} – ${to} ${sy}`
  return `${from} ${sy} – ${to} ${ey}`
}

const monthKey = (p) => `${p.end}-${p.start}`

/** Reverse-chronological by end date, tie-broken on start date. */
export const ORDERED = [...PROJECTS].sort((a, b) =>
  monthKey(b.period).localeCompare(monthKey(a.period))
)

export const bySlug = (slug) => PROJECTS.find((p) => p.slug === slug)

/** In progress - a teaser plate, not a project.
 *
 *  Deliberately outside PROJECTS. Everything that counts the work reads
 *  that array: the masthead says "5/5 Mi-series", the greeting says
 *  "Nine shipped projects", and the SEO payload enumerates them. A
 *  tenth entry would quietly make all three wrong, and a `wip` flag
 *  every consumer had to remember to filter on would be worse - one
 *  missed check and unfinished work is listed as shipped.
 *
 *  春 (haru) is spring - the season things start in. It sits outside
 *  the Mi- family on purpose, which is why the masthead counts the
 *  series as 5/5 and leaves this plate out of the tally. */
export const UPCOMING = {
  name:     'Haru',
  kanji:    '春',
  kicker:   'Link-in-bio · portfolio builder',
  tagline:
    'A customizable digital identity platform where creators, gamers, ' +
    'and developers can build a unique online presence - part ' +
    'link-in-bio, part mini portfolio builder.',
}

/** The project's own live site - where its work-grid card points.
    Marked explicitly with `primary: true` rather than inferred from
    array order: Mirai and Mitsu each ship more than one demo URL, and
    letting position decide picks the wrong one silently. */
export const liveUrl = (p) =>
  (p.links.find((l) => l.primary) ||
   p.links.find((l) => l.kind === 'demo') ||
   p.links[0])?.url ?? null

/* `siblings` and a per-project ROUTES list lived here for the
   standalone case-study pages. Those are gone - projects open as a
   dialog from the work grid - so both were removed rather than left
   as dead exports. */
