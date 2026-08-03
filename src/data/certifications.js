/* Eleven certifications, rendered as a badge card grid.
   Flat rather than grouped by issuer: each card carries its own issuer,
   and grouping would leave Cisco and PMI as lonely single-card rows.

   `badge` is a filename in /public/certs/. Missing files fall back to a
   placeholder shell - drop the image in and it appears, no code change.
   `sort` drives newest-first ordering; `issued` is the display string.

   There is no résumé PDF, so credential IDs live here in full. */

export const CERTIFICATIONS = [
  {
    name:    'IT Specialist - Software Development',
    issuer:  'Certiport',
    issuerFull: 'Certiport - A Pearson VUE Business',
    issued:  'Apr 2026',
    expires: 'Apr 2031',
    sort:    '2026-04',
    id:      'e75904b1-498e-4cad-a22b-eaea1a77b739',
    badge:   'it-specialist-software-development.png',
  },
  {
    name:    'Office Specialist: Associate',
    issuer:  'Microsoft',
    issuerFull: 'Microsoft 365 Apps',
    issued:  'Dec 2025',
    expires: 'Nov 2030',
    sort:    '2025-12',
    id:      'b958badc-7243-4a0c-986d-4ec2a62272cb',
    badge:   'mos-associate.png',
  },
  {
    name:    'Office Specialist: Excel Associate',
    issuer:  'Microsoft',
    issuerFull: 'Microsoft 365 Apps',
    issued:  'Nov 2025',
    expires: 'Nov 2030',
    sort:    '2025-11',
    id:      'acba31df-08a2-404c-98ed-636c3a74eefd',
    badge:   'mos-excel.png',
  },
  {
    name:    'Office Specialist: Word Associate',
    issuer:  'Microsoft',
    issuerFull: 'Microsoft 365 Apps',
    issued:  'Oct 2025',
    expires: 'Oct 2030',
    sort:    '2025-10',
    id:      '711ea235-9476-4556-9dbe-a71faa803880',
    badge:   'mos-word.png',
  },
  {
    name:    'Office Specialist: PowerPoint Associate',
    issuer:  'Microsoft',
    issuerFull: 'Microsoft 365 Apps',
    issued:  'Oct 2025',
    expires: 'Oct 2030',
    sort:    '2025-10',
    id:      '360f9dc8-e22f-4ef7-8d92-718ce71443f3',
    badge:   'mos-powerpoint.png',
  },
  {
    name:    'IT Specialist - Network Security',
    issuer:  'Certiport',
    issuerFull: 'Certiport - A Pearson VUE Business',
    issued:  'May 2025',
    expires: null,
    sort:    '2025-05',
    id:      'b2316b31-94b3-4e95-8b49-8fe23f5f26ee',
    badge:   'it-specialist-network-security.png',
  },
  {
    name:    'IT Specialist - Device Configuration and Management',
    issuer:  'Certiport',
    issuerFull: 'Certiport - A Pearson VUE Business',
    issued:  'Apr 2025',
    expires: null,
    sort:    '2025-04',
    id:      '0948ec02-ef98-406d-8c21-3a54a630c4f1',
    badge:   'it-specialist-device-configuration.png',
  },
  {
    name:    'IC3 Digital Literacy GS6 Level 1',
    issuer:  'Certiport',
    issuerFull: 'Certiport - A Pearson VUE Business',
    issued:  'May 2024',
    expires: null,
    sort:    '2024-05',
    id:      'c48eefed-8236-4df7-afab-60bb8c82c794',
    badge:   'ic3-digital-literacy.png',
  },
  {
    name:    'PMI Project Management Ready™',
    issuer:  'PMI',
    issuerFull: 'Project Management Institute',
    issued:  'Dec 2024',
    expires: null,
    sort:    '2024-12',
    id:      '7497920d-1715-48cf-a281-a26b6d767413',
    badge:   'pmi-project-management-ready.png',
  },
  {
    name:    'IT Specialist - Cybersecurity',
    issuer:  'Certiport',
    issuerFull: 'Certiport - A Pearson VUE Business',
    issued:  'Dec 2024',
    expires: null,
    sort:    '2024-12',
    id:      '803bd7f5-cb6b-4f9f-8f5e-87defca54f94',
    badge:   'it-specialist-cybersecurity.png',
  },
  {
    name:    'Cyber Threat Management',
    issuer:  'Cisco',
    issuerFull: 'Cisco Networking Academy',
    issued:  'Oct 2024',
    expires: null,
    sort:    '2024-10',
    id:      'a9f11e40-263e-4647-9483-2f275133e8df',
    badge:   'cisco-cyber-threat-management.png',
  },
]

/* Newest first. Derived, so adding a cert needs no manual reordering. */
export const CERTS_ORDERED = [...CERTIFICATIONS].sort((a, b) => b.sort.localeCompare(a.sort))

export const CERT_COUNT = CERTIFICATIONS.length

export const CERT_ISSUERS = [...new Set(CERTIFICATIONS.map((c) => c.issuer))]
