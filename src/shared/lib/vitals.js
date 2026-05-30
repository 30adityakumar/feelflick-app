import * as Sentry from '@sentry/react'
// web-vitals v5 removed onFID — FID was retired as a Core Web Vital in favor of
// INP (already reported below via onINP). See https://web.dev/articles/inp.
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

function sendToSentry({ name, value, rating, id }) {
  Sentry.metrics.distribution(`web_vitals.${name.toLowerCase()}`, value, {
    tags: {
      rating,        // 'good' | 'needs-improvement' | 'poor'
      metric_id: id,
    },
    unit: 'millisecond',
  })
}

export function reportWebVitals() {
  onCLS(sendToSentry)
  onFCP(sendToSentry)
  onINP(sendToSentry)
  onLCP(sendToSentry)
  onTTFB(sendToSentry)
}
