// src/app/routes.jsx
import { lazy } from 'react';
export const appRoutes = [
  { path: '/',            element: lazy(() => import('@pages/HomePage')) },
  { path: '/movie/:id',   element: lazy(() => import('@pages/MovieDetail')) },
  { path: '/account',     element: lazy(() => import('@pages/Account')) },
  { path: '/preferences', element: lazy(() => import('@pages/Preferences')) },
  { path: '/auth/*',      element: lazy(() => import('@pages/AuthPage')) },
];
