/* Identity, contact and narrative. Declared once — the hero, contact
   section, footer, nav CTA and JSON-LD all read from here. */

export const PROFILE = {
  name:      'Francis Daniel Genese',
  shortName: 'Francis',
  kanji:     '水',
  brand:     'MIZU',
  role:      'Software Engineer · AI Engineer',
  tagline:   'Agentic AI · LLM Applications · Intelligent Systems',
  location:  'Limay, Central Luzon, Philippines',

  strip: ['Software Engineer', 'AI Engineer', 'Limay, Philippines'],

  intro:
    'I build AI-powered applications and scalable software systems — turning ideas into ' +
    'production-ready software through modern web technologies, intelligent systems and ' +
    'thoughtful system design.',

  about: [
    'Software Engineer building AI-powered applications and scalable software systems. I enjoy ' +
    'transforming ideas into production-ready software through modern web technologies, ' +
    'intelligent systems, and thoughtful system design.',

    'My experience spans full-stack development, AI-integrated platforms, real-time applications, ' +
    'and secure backend architectures. Through hackathons and personal projects, I continuously ' +
    'explore agentic AI, LLMs, and emerging technologies while building solutions that solve ' +
    'real-world problems.',

    'I believe the best way to learn is by building, and I’m always looking for opportunities ' +
    'to contribute, grow, and create technology that makes a meaningful impact.',
  ],

  topSkills: [
    'Software Development',
    'Full-Stack Development',
    'Research and Development (R&D)',
    'Standards Compliance',
    'Software Development Security',
  ],

  availability: {
    status:    'Open to work',
    headline:  'Open to software and AI engineering roles.',
    locations: 'Taguig +2',
    modes:     ['On-site', 'Hybrid', 'Remote'],
  },

  contact: {
    email:    'francisdanielgenese@gmail.com',
    linkedin: 'https://www.linkedin.com/in/francis-daniel-genese-141294170',
    github:   'https://github.com/Mizunandayo',
  },

  /* Displayed forms — kept separate from the hrefs above. */
  contactDisplay: {
    linkedin: 'linkedin.com/in/francis-daniel-genese-141294170',
    github:   'github.com/Mizunandayo',
  },
}

/* Hero stat bar. Every figure is derived from the data files. */
export const HERO_STATS = [
  { num: '9',  lbl: 'Projects shipped' },
  { num: '7',  lbl: 'Hackathon awards' },
  { num: '11', lbl: 'Certifications' },
  { num: '5',  lbl: 'Solo builds in ≤ 8 days' },
]

/* Site-level constants. */
export const SITE = {
  url:   'https://mizu-portfolio.vercel.app',
  title: 'Francis Daniel Genese — Software Engineer & AI Engineer',
  description:
    'Software engineer building AI-powered applications and scalable systems. Nine shipped ' +
    'projects across agentic AI, LLM platforms, computer vision and full-stack web.',
}
