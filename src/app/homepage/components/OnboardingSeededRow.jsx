// src/app/homepage/components/OnboardingSeededRow.jsx
import { Sparkles } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useOnboardingSeededRow } from '@/shared/hooks/useRecommendations'

/**
 * OnboardingSeededRow — "Based on your picks" for cold-start users.
 * Uses onboarding film selections as embedding seeds.
 */
export default function OnboardingSeededRow({
  userId = undefined,
  limit = 20,
  enabled = true,
}) {
  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, loading, error } = useOnboardingSeededRow({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title="Based on your picks"
      movies={data || []}
      loading={loading}
      error={error}
      icon={Sparkles}
      rowId="onboarding-seeded"
      placement="onboarding_seeded"
    />
  )
}
