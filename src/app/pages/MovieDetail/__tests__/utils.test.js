// Unit tests for MovieDetail/utils.js — all pure functions, no network/Supabase.

import { describe, it, expect } from 'vitest'
import { formatRuntime, yearOf, IMG } from '../utils'

// ---------------------------------------------------------------------------
// formatRuntime
// ---------------------------------------------------------------------------
describe('formatRuntime', () => {
  it('returns empty string for falsy values', () => {
    expect(formatRuntime(0)).toBe('')
    expect(formatRuntime(null)).toBe('')
    expect(formatRuntime(undefined)).toBe('')
  })

  it('formats minutes only for values under 60', () => {
    expect(formatRuntime(45)).toBe('45m')
    expect(formatRuntime(1)).toBe('1m')
    expect(formatRuntime(59)).toBe('59m')
  })

  it('formats exactly 60 minutes as 1h 0m', () => {
    expect(formatRuntime(60)).toBe('1h 0m')
  })

  it('formats hours and minutes', () => {
    expect(formatRuntime(90)).toBe('1h 30m')
    expect(formatRuntime(148)).toBe('2h 28m')
    expect(formatRuntime(181)).toBe('3h 1m')
  })

  it('formats films over 3 hours', () => {
    expect(formatRuntime(242)).toBe('4h 2m')
  })
})

// ---------------------------------------------------------------------------
// yearOf
// ---------------------------------------------------------------------------
describe('yearOf', () => {
  it('extracts the year from a full date string', () => {
    expect(yearOf('2023-07-21')).toBe('2023')
  })

  it('handles date strings with just a year', () => {
    expect(yearOf('1994')).toBe('1994')
  })

  it('returns undefined for null', () => {
    expect(yearOf(null)).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(yearOf(undefined)).toBeUndefined()
  })

  it('returns undefined for non-string values', () => {
    expect(yearOf(2023)).toBeUndefined()
  })

  it('returns empty string for an empty string', () => {
    expect(yearOf('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// IMG helpers
// ---------------------------------------------------------------------------
describe('IMG', () => {
  it('builds a correct backdrop URL', () => {
    expect(IMG.backdrop('/abc.jpg')).toBe('https://image.tmdb.org/t/p/original/abc.jpg')
  })

  it('returns empty string when backdrop path is falsy', () => {
    expect(IMG.backdrop(null)).toBe('')
    expect(IMG.backdrop('')).toBe('')
    expect(IMG.backdrop(undefined)).toBe('')
  })

  it('builds a correct poster URL', () => {
    expect(IMG.poster('/xyz.jpg')).toBe('https://image.tmdb.org/t/p/w780/xyz.jpg')
  })

  it('returns empty string when poster path is falsy', () => {
    expect(IMG.poster(null)).toBe('')
  })

  it('builds a correct profile URL', () => {
    expect(IMG.profile('/person.jpg')).toBe('https://image.tmdb.org/t/p/w185/person.jpg')
  })

  it('builds a correct logo URL', () => {
    expect(IMG.logo('/logo.png')).toBe('https://image.tmdb.org/t/p/w92/logo.png')
  })

  it('builds a correct still URL', () => {
    expect(IMG.still('/still.jpg')).toBe('https://image.tmdb.org/t/p/w500/still.jpg')
  })
})
