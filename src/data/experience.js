/* Experience and education - two logo-led panels.

   Experience leads: this is a job-seeking portfolio, so the internship
   matters more to a reader than the degree's start date.

   `logo` is a filename in /public/orgs/ - transparent PNG, no backdrop. */

export const TRACK = [
  {
    id:     'bacsal',
    kind:   'Experience',
    note:   'Internship',
    org:    'Bacsal Business Consultancy',
    title:  'Junior Software Engineer',
    period: 'Jan 2026 - Apr 2026',
    place:  'Mariveles, Bataan · Hybrid',
    logo:   'bacsal.png',
    body:
      'Led development of a full-stack business consultancy CMS - role-based dashboard ' +
      'across 12+ content entities, a dynamic quotation system with PDF generation, SSE ' +
      'audit logging and hardened NextAuth authentication.',
    slug:   'bacsal',
    url:    'https://www.bacsalbusinessconsultancy.com',
  },
  {
    id:     'bpsu',
    kind:   'Education',
    note:   null,
    org:    'Bataan Peninsula State University',
    title:  'Network and Web Application',
    period: 'Aug 2022 - Jul 2026',
    place:  'Bataan, Philippines',
    logo:   'bpsu.png',
    body:   null,
    slug:   null,
    url:    null,
  },
]
