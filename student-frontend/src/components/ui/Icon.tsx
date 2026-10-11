import type { SVGProps } from 'react'

/*
 * A small hand-drawn stroke icon set (24px grid, 1.75 stroke) so the app does
 * not need an icon dependency. Icons are decorative by default; pass `title`
 * when an icon is the only content of a control.
 */
const paths = {
  home: <><path d="M3.5 10.5 12 4l8.5 6.5" /><path d="M5.5 9v10.5h4.75v-5.5h3.5v5.5h4.75V9" /></>,
  students: <><circle cx="9" cy="8.5" r="3.25" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M15.5 5.6a3 3 0 0 1 0 5.8" /><path d="M17.5 14.6c1.6.6 2.7 2.2 3 4.9" /></>,
  enrollments: <><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3.5h6v1" /><path d="m9 12.5 2 2 4-4.5" /></>,
  grades: <><circle cx="12" cy="9" r="5" /><path d="m9.2 13.2-1.7 7.3 4.5-2.4 4.5 2.4-1.7-7.3" /></>,
  programs: <><path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" /><path d="M6.5 11v5c1.6 1.6 3.4 2.4 5.5 2.4s3.9-.8 5.5-2.4v-5" /><path d="M21.5 9v5" /></>,
  courses: <><path d="M4.5 5.5c2.5-.8 5-.6 7.5.8v13c-2.5-1.4-5-1.6-7.5-.8z" /><path d="M19.5 5.5c-2.5-.8-5-.6-7.5.8v13c2.5-1.4 5-1.6 7.5-.8z" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /><path d="M8 14h2M14 14h2M8 17h2" /></>,
  classes: <><rect x="3.5" y="4.5" width="17" height="11.5" rx="1.5" /><path d="M8 20h8M12 16v4" /><path d="m8 11.5 2.5-2.5 2 2 3.5-3.5" /></>,
  accounts: <><circle cx="10" cy="8" r="3.5" /><path d="M3.5 19.5c.7-3.4 3.2-5.3 6.5-5.3 1.2 0 2.3.3 3.2.8" /><circle cx="17.5" cy="17" r="2" /><path d="M17.5 13.5V15M17.5 19v1.5M14.5 17H16M19 17h1.5" /></>,
  shield: <><path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  history: <><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /><path d="M12 8v4.5l3 1.8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 14.6a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.5 1v.3a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-2.6-1l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1-2.5h-.3a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1-2.6l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.6.3h.1a1.5 1.5 0 0 0 .9-1.4v-.3a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.3a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9z" /></>,
  user: <><circle cx="12" cy="8.5" r="3.75" /><path d="M5 20c.8-3.7 3.6-5.8 7-5.8s6.2 2.1 7 5.8" /></>,
  logout: <><path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  filter: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevronRight: <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />,
  arrowLeft: <path d="M19 12H5.5M11 6l-6 6 6 6" />,
  arrowRight: <path d="M5 12h13.5M13 6l6 6-6 6" />,
  upload: <><path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" /><path d="M4.5 15v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7" /><path d="M6.5 7l.9 11.6a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7" /></>,
  pencil: <><path d="M14.5 5.5l4 4L8.5 19.5l-4.5.5.5-4.5z" /><path d="M12.5 7.5l4 4" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: <><path d="M12 4 21 19.5H3z" /><path d="M12 10v4M12 17v.01" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.75v.01" /></>,
  inbox: <><path d="M4 13.5 6.5 5h11l2.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M4 13.5h4.5l1 2h5l1-2H20" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9" /><path d="M19.5 4.5V9H15" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.1-.9-1.4-.9-2.4 0-.9.7-1.6 1.6-1.6h1.9a4.1 4.1 0 0 0 4.1-4.1c0-4-3.8-7.2-8.5-7.2z" /><circle cx="7.75" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="7.75" r="1" /></>,
  building: <><path d="M3.5 20.5h17M5 20.5V9.5L12 5l7 4.5v11" /><path d="M9 20.5V14h6v6.5M9 10.5h.01M15 10.5h.01" /></>,
  sun: <><circle cx="12" cy="12" r="3.75" /><path d="M12 3v1.75M12 19.25V21M3 12h1.75M19.25 12H21M5.6 5.6l1.25 1.25M17.15 17.15l1.25 1.25M5.6 18.4l1.25-1.25M17.15 6.85l1.25-1.25" /></>,
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />,
  sunrise: <><path d="M5 17.5a7 7 0 0 1 14 0" /><path d="M3 20.5h18M12 4v4M5.6 9.6l1.4 1.4M18.4 9.6 17 11M9.5 6.5 12 4l2.5 2.5" /></>,
  file: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" /></>,
} as const

export type IconName = keyof typeof paths

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName
  size?: number
  title?: string
}

export default function Icon({ name, size = 18, title, className, strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  )
}
