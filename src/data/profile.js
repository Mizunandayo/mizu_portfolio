import { PROJECTS } from './projects.js'
import { HACKATHONS } from './hackathons.js'
import { CERT_COUNT } from './certifications.js'

/* Identity, contact and narrative. Declared once - the hero, contact
   section, footer, nav CTA and JSON-LD all read from here. */

export const PROFILE = {
  name:      'Francis Daniel',
  shortName: 'Francis',
  kanji:     '水',
  brand:     'MIZU',
  /* The name the work is signed with online. Kept beside the legal one
     rather than instead of it: a recruiter searching either should land
     on the same person. */
  alias:     'Mizu',
  role:      'Agentic AI Engineer',
  tagline:   'Agentic AI · LLM Applications · Intelligent Systems',
  location:  'Philippines',

  strip: ['Agentic AI Engineer', 'Philippines'],

  intro:
    'Agentic systems designed to solve real problems through meaningful solutions and thoughtful technology.',

  /* The About section's claim. Stated as a rule rather than a virtue -
     "discipline is to build it" describes a quality; this makes a
     claim the rest of the page then has to back up, and every project
     below is evidence for it. */


  claim: 'Every build brings mastery',


  about: [
    'Agentic AI Engineer building AI-powered applications and scalable software systems. I enjoy ' +
    'transforming ideas into production-ready software through modern web technologies, ' +
    'intelligent systems, and thoughtful system design.',

    'My experience spans full-stack development, AI-integrated platforms, real-time applications, ' +
    'and secure backend architectures. Through hackathons and personal projects, I continuously ' +
    'explore agentic AI, LLMs, and emerging technologies while building solutions that solve ' +
    'real-world problems.',

    'My path of growth is by building, and I’m always looking for opportunities ' +
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
    status:    '',
    headline:  'Open to Agentic AI Engineering roles.',
    modes:     ['On-site', 'Hybrid', 'Remote'],
  },

  contact: {
    email:    'francisdanielgenese@gmail.com',
    linkedin: 'https://www.linkedin.com/in/francis-daniel-genese-141294170',
    github:   'https://github.com/Mizunandayo',
    credly:   'https://www.credly.com/users/francis-daniel-genese',
  },

  /* Discord user ID — the numeric snowflake, not the handle. Enable
     Developer Mode in Discord (Settings → Advanced), then right-click
     your own name and Copy User ID.

     Presence is read through Lanyard, which can only see you if its bot
     shares a server with you: join discord.gg/lanyard once and it works
     from then on. Without that the API answers 404 and the card simply
     does not render. */
  discordId: '714616104630222899',

  /* Displayed forms - kept separate from the hrefs above. */
  contactDisplay: {
    linkedin: 'in/francis-daniel-genese-141294170',
    github:   'Mizunandayo',
    credly:   'users/francis-daniel-genese',
  },

  /* /public/profile/portrait.png - transparent cut-out, no backdrop.
     Missing shows a placeholder. */
  portrait: { src: 'portrait.png', alt: 'Francis Daniel Genese' },
}

/* Contact channels, rendered as a directory rather than a row of
   buttons - one shape for every way to reach him. */
export const CHANNELS = [
  { key: 'email',    label: 'Email',    value: PROFILE.contact.email,
    href: `mailto:${PROFILE.contact.email}` },
  { key: 'linkedin', label: 'LinkedIn', value: PROFILE.contactDisplay.linkedin,
    href: PROFILE.contact.linkedin, external: true },
  { key: 'github',   label: 'GitHub',   value: PROFILE.contactDisplay.github,
    href: PROFILE.contact.github, external: true },
  { key: 'credly',   label: 'Credly',   value: PROFILE.contactDisplay.credly,
    href: PROFILE.contact.credly, external: true },
]

/* Hero stat bar. Counts are read from the data files rather than typed,
   so adding a project, hackathon or certification updates the hero
   automatically. Only the last figure is a hand-written claim. */


/* Site-level constants. */
export const SITE = {
  url:   'https://mizuuu.vercel.app',
  title: 'Francis Daniel Genese - Agentic AI Engineer',
  description:
    'Agentic AI Engineer building AI-powered applications and scalable systems. Nine shipped ' +
    'projects across agentic AI, LLM platforms, computer vision and full-stack web.',
}
