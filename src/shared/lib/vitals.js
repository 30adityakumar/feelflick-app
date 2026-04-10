import * as Sentry from '@sentry/react'
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals'

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
  onFID(sendToSentry)
  onINP(sendToSentry)
  onLCP(sendToSentry)
  onTTFB(sendToSentry)
}
