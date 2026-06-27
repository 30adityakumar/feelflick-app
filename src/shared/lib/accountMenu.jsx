// src/shared/lib/accountMenu.jsx
// Single source of truth for the account menu shown in two places:
//   • the desktop header avatar dropdown (src/app/header/Header.jsx → AvatarMenu)
//   • the mobile "You" hub page (src/features/account/YouMenu.jsx)
// Data + icons only — no sign-out here (it depends on the onboarding draft, a feature
// layer); each consumer wires its own sign-out so this stays in the shared layer.

import { Bookmark, Clock, LayoutGrid, ListVideo, Settings, User, Users } from 'lucide-react'

/** Navigable account destinations, in display order. */
export const ACCOUNT_MENU = [
  { label: 'Account',   to: '/account',     Icon: User },
  { label: 'Browse',    to: '/browse',      Icon: LayoutGrid },
  { label: 'Watchlist', to: '/watchlist',   Icon: Bookmark },
  { label: 'Diary',     to: '/history',     Icon: Clock },
  { label: 'People',    to: '/people',      Icon: Users },
  { label: 'Lists',     to: '/lists',       Icon: ListVideo },
  { label: 'Settings',  to: '/preferences', Icon: Settings },
]

/** "Send feedback" opens the user's mail client (no in-app feedback surface yet). */
export const FEEDBACK_HREF = 'mailto:hello@feelflick.com?subject=Feelflick%20feedback'
