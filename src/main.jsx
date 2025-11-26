// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import './index.css'
import AuthInitializer from '@/app/AuthInitializer'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthInitializer>
      <RouterProvider router={router} />
    </AuthInitializer>
  </React.StrictMode>
)
