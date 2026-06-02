import { describe, it, expect } from 'vitest'
import { resolveSupabaseUrl } from './db'

describe('resolveSupabaseUrl', () => {
  it('uses the provided url when valid', () => {
    expect(resolveSupabaseUrl('https://api.example.com', 'https://site.com')).toBe('https://api.example.com')
  })

  it('falls back to <origin>/supabase when url is empty', () => {
    expect(resolveSupabaseUrl('', 'https://site.com')).toBe('https://site.com/supabase')
  })

  it('falls back when url contains a placeholder', () => {
    expect(resolveSupabaseUrl('http://placeholder', 'https://site.com')).toBe('https://site.com/supabase')
  })
})
