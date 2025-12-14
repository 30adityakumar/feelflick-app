// src/app/admin/CacheMonitoring.jsx
import { useState, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { BarChart3, RefreshCw, Users, Database, Clock, TrendingUp } from 'lucide-react'

export default function CacheMonitoring() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [warming, setWarming] = useState(false)
  const [warmResult, setWarmResult] = useState(null)

  const fetchStats = async () => {
    try {
      setRefreshing(true)

      // Fetch cache statistics
      const { data: cacheData, error } = await supabase
        .from('user_profiles_computed')
        .select('user_id, confidence, computed_at, data_points')

      if (error) throw error

      // Fetch total users for comparison
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Process statistics
      const now = Date.now()
      const byConfidence = { none: 0, low: 0, medium: 0, high: 0 }
      const byAge = { fresh: 0, recent: 0, stale: 0, expired: 0 }
      const byDataPoints = { empty: 0, sparse: 0, moderate: 0, rich: 0 }
      let totalAge = 0

      cacheData.forEach(cache => {
        // Confidence breakdown
        byConfidence[cache.confidence]++

        // Age breakdown
        const ageMs = now - new Date(cache.computed_at).getTime()
        const ageHours = ageMs / (1000 * 60 * 60)
        totalAge += ageMs

        if (ageHours < 1) byAge.fresh++
        else if (ageHours < 24) byAge.recent++
        else if (ageHours < 168) byAge.stale++ // < 7 days
        else byAge.expired++ // > 7 days

        // Data points breakdown
        if (cache.data_points === 0) byDataPoints.empty++
        else if (cache.data_points < 10) byDataPoints.sparse++
        else if (cache.data_points < 30) byDataPoints.moderate++
        else byDataPoints.rich++
      })

      const avgAgeMinutes = cacheData.length > 0 
        ? totalAge / cacheData.length / 1000 / 60 
        : 0

      setStats({
        total: cacheData.length,
        totalUsers,
        cacheHitRate: totalUsers > 0 ? (cacheData.length / totalUsers * 100).toFixed(1) : 0,
        byConfidence,
        byAge,
        byDataPoints,
        avgAgeMinutes: Math.round(avgAgeMinutes),
        oldestCache: cacheData.length > 0 
          ? Math.max(...cacheData.map(c => now - new Date(c.computed_at).getTime())) / (1000 * 60 * 60)
          : 0
      })

    } catch (error) {
      console.error('[CacheMonitoring] Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const warmCache = async () => {
    try {
      setWarming(true)
      setWarmResult(null)

      // Get active users from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: activeUsers, error } = await supabase
        .from('users')
        .select('id')
        .gte('last_active_at', thirtyDaysAgo)
        .limit(50) // Limit to 50 at a time to avoid timeout

      if (error) throw error

      let warmed = 0
      let skipped = 0

      for (const user of activeUsers || []) {
        // Check if cache exists and is fresh
        const { data: cached } = await supabase
          .from('user_profiles_computed')
          .select('computed_at')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cached) {
          const age = Date.now() - new Date(cached.computed_at).getTime()
          if (age < 6 * 60 * 60 * 1000) { // < 6 hours
            skipped++
            continue
          }
        }

        // Invalidate cache - will recompute on next visit
        await supabase
          .from('user_profiles_computed')
          .delete()
          .eq('user_id', user.id)

        warmed++
      }

      setWarmResult({
        success: true,
        total: activeUsers.length,
        warmed,
        skipped
      })

      // Refresh stats after warming
      await fetchStats()

    } catch (error) {
      console.error('[warmCache] Error:', error)
      setWarmResult({
        success: false,
        error: error.message
      })
    } finally {
      setWarming(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* ========== HEADER WITH BUTTONS ========== */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Profile Cache Monitoring</h1>
            <p className="text-gray-400">Real-time statistics for user profile caching system</p>
          </div>
          
          {/* BUTTONS HERE */}
          <div className="flex items-center gap-3">
            <button
              onClick={warmCache}
              disabled={warming}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className={`h-4 w-4 ${warming ? 'animate-pulse' : ''}`} />
              {warming ? 'Warming...' : 'Warm Cache'}
            </button>

            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ========== RESULT MESSAGE ========== */}
        {warmResult && (
          <div className={`mb-6 p-4 rounded-lg ${warmResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            {warmResult.success ? (
              <p className="text-green-400">
                ✓ Cache warming complete: {warmResult.warmed} profiles invalidated, {warmResult.skipped} skipped (fresh cache)
              </p>
            ) : (
              <p className="text-red-400">
                ✗ Error: {warmResult.error}
              </p>
            )}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Database className="h-6 w-6" />}
            label="Cached Profiles"
            value={stats.total}
            subtext={`${stats.cacheHitRate}% of users`}
            color="purple"
          />
          <MetricCard
            icon={<Users className="h-6 w-6" />}
            label="Total Users"
            value={stats.totalUsers}
            subtext="Registered accounts"
            color="blue"
          />
          <MetricCard
            icon={<Clock className="h-6 w-6" />}
            label="Avg Cache Age"
            value={`${stats.avgAgeMinutes}m`}
            subtext={`Oldest: ${Math.round(stats.oldestCache)}h`}
            color="green"
          />
          <MetricCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="High Confidence"
            value={stats.byConfidence.high}
            subtext={`${stats.total > 0 ? ((stats.byConfidence.high / stats.total) * 100).toFixed(0) : 0}% of caches`}
            color="pink"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Confidence Distribution */}
          <ChartCard title="Confidence Distribution" icon={<BarChart3 />}>
            <BarGroup
              data={[
                { label: 'High', value: stats.byConfidence.high, color: 'bg-green-500' },
                { label: 'Medium', value: stats.byConfidence.medium, color: 'bg-yellow-500' },
                { label: 'Low', value: stats.byConfidence.low, color: 'bg-orange-500' },
                { label: 'None', value: stats.byConfidence.none, color: 'bg-red-500' },
              ]}
              total={stats.total}
            />
          </ChartCard>

          {/* Age Distribution */}
          <ChartCard title="Cache Freshness" icon={<Clock />}>
            <BarGroup
              data={[
                { label: 'Fresh (<1h)', value: stats.byAge.fresh, color: 'bg-green-500' },
                { label: 'Recent (<24h)', value: stats.byAge.recent, color: 'bg-blue-500' },
                { label: 'Stale (<7d)', value: stats.byAge.stale, color: 'bg-yellow-500' },
                { label: 'Expired (>7d)', value: stats.byAge.expired, color: 'bg-red-500' },
              ]}
              total={stats.total}
            />
          </ChartCard>

          {/* Data Points Distribution */}
          <ChartCard title="Profile Richness" icon={<Database />}>
            <BarGroup
              data={[
                { label: 'Rich (30+)', value: stats.byDataPoints.rich, color: 'bg-purple-500' },
                { label: 'Moderate (10-29)', value: stats.byDataPoints.moderate, color: 'bg-blue-500' },
                { label: 'Sparse (1-9)', value: stats.byDataPoints.sparse, color: 'bg-yellow-500' },
                { label: 'Empty (0)', value: stats.byDataPoints.empty, color: 'bg-gray-500' },
              ]}
              total={stats.total}
            />
          </ChartCard>
        </div>

        {/* Insights */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
          <div className="space-y-2 text-sm text-gray-300">
            {stats.byAge.expired > 0 && (
              <p className="flex items-start gap-2">
                <span className="text-yellow-400">⚠️</span>
                <span>
                  {stats.byAge.expired} caches are expired (&gt;7 days old). Click "Warm Cache" to refresh them.
                </span>
              </p>
            )}
            {stats.cacheHitRate < 50 && (
              <p className="flex items-start gap-2">
                <span className="text-blue-400">ℹ️</span>
                <span>
                  Cache hit rate is {stats.cacheHitRate}%. Click "Warm Cache" to pre-populate profiles.
                </span>
              </p>
            )}
            {stats.byConfidence.high / stats.total > 0.7 && (
              <p className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>
                  Excellent! {((stats.byConfidence.high / stats.total) * 100).toFixed(0)}% of profiles have high confidence.
                </span>
              </p>
            )}
            {stats.byDataPoints.empty > 0 && (
              <p className="flex items-start gap-2">
                <span className="text-orange-400">!</span>
                <span>
                  {stats.byDataPoints.empty} users have empty profiles (no watch history). These are likely new users.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function MetricCard({ icon, label, value, subtext, color }) {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    pink: 'bg-pink-500/10 text-pink-400',
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{subtext}</div>
    </div>
  )
}

function ChartCard({ title, icon, children }) {
  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-gray-400">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function BarGroup({ data, total }) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0
        return (
          <div key={idx}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-gray-300 font-medium">{item.value}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{percentage.toFixed(1)}%</div>
          </div>
        )
      })}
    </div>
  )
}