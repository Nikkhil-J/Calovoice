import type { ReactNode } from 'react'

type HeaderIconButtonProps = {
  onClick: () => void
  ariaLabel: string
  title?: string
  children: ReactNode
}

type HeaderNavButtonProps = {
  onClick: () => void
  ariaLabel: string
  title?: string
  icon?: 'back' | 'home'
}

type PageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  titleSuffix?: ReactNode
  onBack?: () => void
  backIcon?: 'back' | 'home'
  backAriaLabel?: string
  backTitle?: string
  rightAction?: ReactNode
  reserveRightSlot?: boolean
}

export function HeaderNavButton({
  onClick,
  ariaLabel,
  title,
  icon = 'back',
}: HeaderNavButtonProps) {
  return (
    <button
      type="button"
      className="header-nav-btn"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {icon === 'home' ? <HomeIcon /> : <ChevronLeftIcon />}
    </button>
  )
}

export function HeaderIconButton({
  onClick,
  ariaLabel,
  title,
  children,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      className="header-icon-btn"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  )
}

export function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M12 5L7 10l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3l9 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PageHeader({
  title,
  subtitle,
  titleSuffix,
  onBack,
  backIcon,
  backAriaLabel = 'Back',
  backTitle,
  rightAction,
  reserveRightSlot = false,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      {onBack && (
        <HeaderNavButton
          onClick={onBack}
          ariaLabel={backAriaLabel}
          title={backTitle}
          icon={backIcon}
        />
      )}

      {subtitle ? (
        <div className="page-header-stack">
          <h1 className="page-header-title">{title}</h1>
          <p className="page-header-sub">{subtitle}</p>
        </div>
      ) : (
        <div className="page-header-title-row">
          <h1 className="page-header-title">{title}</h1>
          {titleSuffix}
        </div>
      )}

      {rightAction ? (
        <div className="page-header-actions">{rightAction}</div>
      ) : reserveRightSlot ? (
        <span className="header-end-slot" aria-hidden />
      ) : null}
    </header>
  )
}
