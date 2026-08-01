/* Dev helper: node scripts/find-slug.mjs openai gemini tree */
import * as si from 'simple-icons'

const all = Object.values(si).filter((v) => v && typeof v === 'object' && v.slug && v.title)
const terms = process.argv.slice(2).map((t) => t.toLowerCase())

if (!terms.length) {
  console.log(`simple-icons has ${all.length} icons. Pass search terms.`)
  process.exit(0)
}

for (const t of terms) {
  const hits = all.filter(
    (i) => i.title.toLowerCase().includes(t) || i.slug.toLowerCase().includes(t)
  )
  console.log(`\n"${t}" — ${hits.length} hit(s)`)
  hits.slice(0, 12).forEach((i) => console.log(`   ${i.slug.padEnd(28)} ${i.title}`))
}
