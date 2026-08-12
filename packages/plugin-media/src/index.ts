import { lazy } from 'react'
import { CMS_CAPABILITIES, definePlugin } from '@imba/core'
import V001_media from './migrations/V001_media.sql?raw'
import { setMediaDb } from './mediaClient'

const MediaAdmin = lazy(async () => import('./admin/MediaAdmin'))

export default definePlugin({
  name: 'media',
  version: '0.1.0',
  tablePrefix: 'media_',
  admin: {
    nav: {
      group: 'Content',
      label: 'Media',
      path: '/admin/media',
      icon: 'Image',
      requiredCapabilities: [CMS_CAPABILITIES.mediaRead],
    },
    pages: [
      { path: '/admin/media', element: MediaAdmin, requiredCapabilities: [CMS_CAPABILITIES.mediaRead] },
    ],
  },
  migrations: [
    { id: 'media.V001', sql: V001_media },
  ],
  register(ctx) {
    setMediaDb(ctx.db)
  },
})

export { MediaPickerField } from './MediaPickerField'
export {
  deleteMediaAsset,
  listMediaAssets,
  mediaDb,
  registerExternalMedia,
  resolveMediaBucket,
  setMediaDb,
  updateMediaAsset,
  uploadMediaAsset,
} from './mediaClient'
export type { CreateExternalMediaInput, MediaAsset, UpdateMediaAssetInput, UploadMediaInput } from './types'
