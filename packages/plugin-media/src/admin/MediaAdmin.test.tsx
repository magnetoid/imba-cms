// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CmsSessionProvider } from '@imba/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MediaAdmin from './MediaAdmin'

const mediaMocks = vi.hoisted(() => ({
  listMediaAssets: vi.fn(),
  registerExternalMedia: vi.fn(),
  resolveMediaBucket: vi.fn(() => 'cms-media'),
  updateMediaAsset: vi.fn(),
  uploadMediaAsset: vi.fn(),
  deleteMediaAsset: vi.fn(),
}))

vi.mock('../mediaClient', () => mediaMocks)

describe('MediaAdmin', () => {
  beforeEach(() => {
    mediaMocks.listMediaAssets.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Hero image',
        alt_text: 'A dramatic hero image',
        url: 'https://cdn.example.com/hero.jpg',
        source_type: 'external',
        mime_type: 'image/jpeg',
        width: 1200,
        height: 630,
        created_at: '2026-08-10T00:00:00.000Z',
      },
    ])
    mediaMocks.updateMediaAsset.mockImplementation(async (value) => ({
      id: value.id,
      title: value.title,
      alt_text: value.altText,
      url: value.url,
      source_type: 'external',
      mime_type: value.mimeType,
      created_at: '2026-08-10T00:00:00.000Z',
    }))
  })

  it('loads assets and saves metadata edits', async () => {
    render(
      <CmsSessionProvider
        session={{
          user: {
            id: 'user-1',
            app_metadata: {
              permissions: ['media.write'],
            },
          },
        }}
      >
        <MediaAdmin />
      </CmsSessionProvider>,
    )

    expect(await screen.findByText('Hero image')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    fireEvent.change(screen.getByDisplayValue('Hero image'), { target: { value: 'Updated hero image' } })
    fireEvent.change(screen.getByDisplayValue('A dramatic hero image'), { target: { value: 'Updated alt text' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save asset' }))

    await waitFor(() => {
      expect(mediaMocks.updateMediaAsset).toHaveBeenCalledTimes(1)
      expect(mediaMocks.updateMediaAsset).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated hero image',
        altText: 'Updated alt text',
      }))
    })
  })
})
