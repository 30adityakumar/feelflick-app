// src/features/account/accountSections.js
// Single source of truth for the Account settings sections — consumed by the desktop
// sidebar, the mobile settings index, the detail renderer, and the URL ?section= router.
// Pure data only (no JSX): the pane component for each id is wired in AccountDetail, and
// the icon glyph in SectionIcon, so this module stays import-cycle-free + testable.

export const SECTIONS = [
  { id: 'overview',      label: 'Overview',            group: 'Account', icon: 'overview',      mobileBlurb: 'Account summary' },
  { id: 'personal',      label: 'Personal Information', group: 'Account', icon: 'personal',      mobileBlurb: 'Name, email, profile photo' },
  { id: 'privacy',       label: 'Privacy',             group: 'Account', icon: 'privacy',       mobileBlurb: 'Private film behaviour and analytics' },
  { id: 'notifications', label: 'Notifications',       group: 'Account', icon: 'notifications', mobileBlurb: 'Daily Briefing' },
  { id: 'connections',   label: 'Connections',         group: 'Access',  icon: 'connections',   mobileBlurb: 'Google and film services' },
  { id: 'security',      label: 'Sign-In & Security',  group: 'Access',  icon: 'security',      mobileBlurb: 'Devices and sessions' },
  { id: 'data',          label: 'Data & Deletion',     group: 'Access',  icon: 'data',          mobileBlurb: 'Restart taste setup or delete account' },
]

export const SECTION_GROUPS = ['Account', 'Access']
export const DEFAULT_SECTION = 'overview'
export const VALID_SECTIONS = new Set(SECTIONS.map((s) => s.id))

// Map a raw ?section= value to a valid section id (invalid → safe Overview fallback).
export function resolveSection(raw) {
  return raw && VALID_SECTIONS.has(raw) ? raw : DEFAULT_SECTION
}

export function sectionById(id) {
  return SECTIONS.find((s) => s.id === id) || SECTIONS[0]
}

export function sectionsByGroup(group) {
  return SECTIONS.filter((s) => s.group === group)
}
