/* Aggregate technology across all nine projects — curated rather than
   auto-derived, because a raw union of every projects.js entry runs to
   ~120 items and reads as noise. Ordered by depth of use. */

export const STACK = [
  {
    category: 'Languages',
    note: 'Primary day-to-day.',
    items: [
      { name: 'TypeScript' }, { name: 'JavaScript' }, { name: 'Python', ver: '3.12' },
      { name: 'HTML' }, { name: 'CSS' }, { name: 'SCSS' },
    ],
  },
  {
    category: 'AI & Agents',
    note: 'Agentic workflows, LLM orchestration, evaluation.',
    items: [
      { name: 'LangGraph' }, { name: 'LangChain' }, { name: 'MCP Adapters' },
      { name: 'OpenAI', role: 'GPT-5.6 · Whisper' }, { name: 'Gemini 2.5', role: 'Pro · Flash' },
      { name: 'Llama 3.3 70B' }, { name: 'vLLM' }, { name: 'Langfuse' },
      { name: 'pgvector' }, { name: 'Qdrant' },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { name: 'React', ver: '18 / 19' }, { name: 'Next.js', ver: '16' }, { name: 'Vite' },
      { name: 'Tailwind CSS', ver: '3 / v4' }, { name: 'shadcn/ui' }, { name: 'Radix UI' },
      { name: 'Framer Motion' }, { name: 'GSAP' }, { name: 'React Three Fiber' },
      { name: 'Jotai' }, { name: 'Tauri', ver: 'v2' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'FastAPI' }, { name: 'Node.js' }, { name: 'Express' },
      { name: 'Prisma', ver: '7' }, { name: 'NextAuth', ver: 'v5' },
      { name: 'Socket.IO' }, { name: 'Server-Sent Events' }, { name: 'WebSocket' },
    ],
  },
  {
    category: 'Data & Infrastructure',
    items: [
      { name: 'PostgreSQL' }, { name: 'MongoDB' }, { name: 'Redis', role: 'Upstash' },
      { name: 'Supabase' }, { name: 'Firebase' }, { name: 'Docker' },
      { name: 'Google Cloud Run' }, { name: 'Vercel' }, { name: 'Railway' },
      { name: 'Cloudinary' },
    ],
  },
  {
    category: 'Computer Vision & Physics',
    items: [
      { name: 'MediaPipe' }, { name: 'OpenCV' }, { name: 'Rapier WASM' },
      { name: 'MuJoCo', ver: '3.x' },
    ],
  },
  {
    category: 'Security & Quality',
    note: 'Auth, validation, hardening, testing.',
    items: [
      { name: 'JWT' }, { name: 'Google OAuth' }, { name: 'Valibot' },
      { name: 'CSP / HSTS' }, { name: 'Rate limiting' },
      { name: 'pytest' }, { name: 'Vitest' }, { name: 'Ruff' }, { name: 'Black' },
      { name: 'ESLint' },
    ],
  },
  {
    category: 'Tooling',
    items: [
      { name: 'Git' }, { name: 'GitHub' }, { name: 'GitLab' },
      { name: 'Postman' }, { name: 'Puppeteer' }, { name: 'tree-sitter' },
    ],
  },
]
