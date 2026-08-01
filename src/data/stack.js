/* Aggregate technology across all nine projects, reconciled against the
   published stack pages for Mitsu, Minari, Misaki, Mirai and Miwa.
   Ordered by depth of use within each layer. */

export const STACK = [
  {
    category: 'Languages',
    note: 'Primary day-to-day.',
    items: [
      { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'Python', ver: '3.12' },
      { name: 'Rust', role: 'Tauri runtime' },
      { name: 'HTML' }, { name: 'CSS' }, { name: 'SCSS' },
    ],
  },
  {
    category: 'AI & Agents',
    note: 'Agentic workflows, LLM orchestration, evaluation.',
    items: [
      { name: 'LangGraph', ver: '0.2' }, { name: 'LangChain' }, { name: 'CrewAI' },
      { name: 'MCP Adapters' },
      { name: 'OpenAI', role: 'GPT-5.6' },
      { name: 'AI/ML API', role: 'GPT-4.1 · 4o · 4o-mini' },
      { name: 'Gemini 2.5', role: 'Pro · Flash' },
      { name: 'Gemini 2.0 Flash', role: 'fallback' },
      { name: 'gemini-embedding-001', role: '768-d' },
      { name: 'Llama 3.3 70B' }, { name: 'Qwen2.5 72B' },
      { name: 'Langfuse', role: 'tracing' },
      { name: 'Vercel AI SDK', role: 'streaming' },
    ],
  },
  {
    category: 'GPU & Inference',
    note: 'Self-hosted model serving, on-device inference.',
    items: [
      { name: 'AMD MI300X', role: '192 GB HBM3 · FP16' },
      { name: 'ROCm', ver: '7.2' },
      { name: 'vLLM', ver: '0.17' },
      { name: 'TensorFlow Lite', role: 'XNNPACK' },
    ],
  },
  {
    category: 'Speech & Language',
    items: [
      { name: 'OpenAI Whisper', role: 'STT' },
      { name: 'gpt-4o-mini-transcribe' },
      { name: 'edge-tts', role: 'TTS' },
      { name: 'Google Translate' },
      { name: 'pykakasi', role: 'romaji' },
      { name: 'sounddevice', role: 'mic capture' },
    ],
  },
  {
    category: 'Vision & Physics',
    note: 'On-device perception, simulation, kinematics.',
    items: [
      { name: 'MediaPipe', role: '21-pt hand' }, { name: 'OpenCV' }, { name: 'NumPy' },
      { name: 'One Euro Filter', role: 'smoothing' },
      { name: 'Rapier WASM', role: 'client sim' },
      { name: 'MuJoCo', ver: '3.x', role: 'server validation' },
      { name: 'Three.js' },
      { name: 'FABRIK', role: 'inverse kinematics' },
    ],
  },
  {
    category: 'Web Data',
    note: 'Live collection at scale.',
    items: [
      { name: 'Bright Data MCP Server' }, { name: 'Web Unlocker' }, { name: 'SERP API' },
      { name: 'Web Scraper API' }, { name: 'Scraping Browser' }, { name: 'Puppeteer' },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { name: 'React', ver: '18 / 19' }, { name: 'Next.js', ver: '16' }, { name: 'Vite' },
      { name: 'Tauri', ver: 'v2' },
      { name: 'Tailwind CSS', ver: '3 / v4' }, { name: 'shadcn/ui' }, { name: 'Radix UI' },
      { name: 'Material UI' },
      { name: 'Framer Motion', ver: '11' }, { name: 'GSAP' },
      { name: 'React Three Fiber' }, { name: 'React Flow', ver: 'v12' },
      { name: 'Jotai' }, { name: 'Zustand' }, { name: 'Immer' },
      { name: 'D3.js', ver: 'v7' }, { name: 'Recharts' }, { name: 'ApexCharts' },
      { name: 'React Simple Maps' },
      { name: 'Lucide' }, { name: 'Prism', role: 'diff highlighting' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'FastAPI' }, { name: 'Node.js' }, { name: 'Express' },
      { name: 'Pydantic', ver: 'v2' }, { name: 'SQLAlchemy' }, { name: 'Alembic', role: 'migrations' },
      { name: 'asyncpg' }, { name: 'Celery', role: 'task queue' },
      { name: 'Prisma', ver: '7' }, { name: 'NextAuth', ver: 'v5' },
      { name: 'Socket.IO' }, { name: 'sse-starlette' }, { name: 'WebSocket' },
      { name: 'Jinja2' }, { name: 'WeasyPrint', role: 'PDF' },
      { name: 'discord.js', ver: 'v14' },
    ],
  },
  {
    category: 'Data & Infrastructure',
    items: [
      { name: 'PostgreSQL' }, { name: 'pgvector', role: 'HNSW' }, { name: 'Supabase' },
      { name: 'MongoDB' }, { name: 'SQLite', role: 'WAL' }, { name: 'Qdrant' },
      { name: 'Redis', role: 'Upstash' }, { name: 'Firebase' },
      { name: 'Docker' }, { name: 'Google Cloud Run' }, { name: 'Secret Manager' },
      { name: 'Vercel' }, { name: 'Railway' }, { name: 'Cloudinary' },
    ],
  },
  {
    category: 'Security & Quality',
    note: 'Auth, validation, hardening, testing, observability.',
    items: [
      { name: 'JWT' }, { name: 'HMAC', role: 'constant-time' }, { name: 'Google OAuth' },
      { name: 'Valibot' }, { name: 'CSP / HSTS' },
      { name: 'slowapi', role: 'rate limiting' },
      { name: 'defusedxml', role: 'XXE-hardened' },
      { name: 'SHA-256', role: 'model pinning' },
      { name: 'structlog' }, { name: 'Sentry' },
      { name: 'pytest' }, { name: 'Vitest' }, { name: 'Ruff' }, { name: 'Black' },
      { name: 'ESLint' },
    ],
  },
  {
    category: 'Tooling',
    items: [
      { name: 'Git' }, { name: 'GitHub' }, { name: 'GitLab' }, { name: 'GitLab MCP' },
      { name: 'uv', role: 'packaging' }, { name: 'Hatchling' },
      { name: 'tree-sitter', role: 'syntax gate' },
      { name: 'python-dotenv' }, { name: 'Postman' },
      { name: 'Codex', role: 'build partner' },
    ],
  },
]
