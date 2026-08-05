/* Shared by the panel's two views. Stroke-only and currentColor, so a
   button's own state colours them without a variant per icon. */

const box = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

export const EyeIcon = ({ off }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" strokeWidth="1.4" {...box}>
    <path d="M1 8s2.6-4.2 7-4.2S15 8 15 8s-2.6 4.2-7 4.2S1 8 1 8Z" />
    <circle cx="8" cy="8" r="1.9" />
    {off && <path d="M2.4 13.6 13.6 2.4" />}
  </svg>
)

export const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.5" {...box}>
    <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.6 9.5h6.8L12 4M6.5 6.5v5M9.5 6.5v5" />
  </svg>
)

export const MailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" strokeWidth="1.4" {...box}>
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.6" />
    <path d="m2.4 4.6 5.6 4 5.6-4" />
  </svg>
)

export const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" {...box}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" strokeWidth="1.4" {...box}>
    <rect x="5.5" y="5.5" width="9" height="9" rx="1.5" />
    <path d="M10.5 3.2V2.6a1.1 1.1 0 0 0-1.1-1.1H2.6a1.1 1.1 0 0 0-1.1 1.1v6.8a1.1 1.1 0 0 0 1.1 1.1h.6" />
  </svg>
)

export const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.4" {...box}>
    <path d="M14.5 1.5 7.3 8.7M14.5 1.5l-4.6 13-2.6-5.8-5.8-2.6 13-4.6Z" />
  </svg>
)

export const TicketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" strokeWidth="1.4" {...box}>
    <path d="M2.5 6.2a1.2 1.2 0 0 1 1.2-1.2h12.6a1.2 1.2 0 0 1 1.2 1.2V8a2 2 0 0 0 0 4v1.8a1.2 1.2 0 0 1-1.2 1.2H3.7a1.2 1.2 0 0 1-1.2-1.2V12a2 2 0 0 0 0-4V6.2Z" />
    <path d="M12 5.6v1.2M12 9.4v1.2M12 13.2v1.2" strokeDasharray="0.1 2" />
  </svg>
)

export const PeopleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" strokeWidth="1.4" {...box}>
    <circle cx="7.6" cy="7" r="2.8" />
    <path d="M2.4 16.2a5.2 5.2 0 0 1 10.4 0" />
    <path d="M13.4 4.6a2.8 2.8 0 0 1 0 5.2M14.6 11.6a5.2 5.2 0 0 1 3 4.6" />
  </svg>
)

export const ExitIcon = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" strokeWidth="1.4" {...box}>
    <path d="M8 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h3" />
    <path d="M12 6.5 15.5 10 12 13.5M15.5 10H7.5" />
  </svg>
)
