export interface MediaAsset {
  id: string
  title?: string
  alt_text?: string
  url: string
  storage_bucket?: string
  storage_path?: string
  source_type: 'upload' | 'external'
  mime_type?: string
  size_bytes?: number
  width?: number
  height?: number
  created_at: string
  updated_at?: string
  created_by?: string
}

export interface CreateExternalMediaInput {
  title?: string
  altText?: string
  url: string
  mimeType?: string
}

export interface UpdateMediaAssetInput {
  id: string
  title?: string
  altText?: string
  url?: string
  mimeType?: string
}

export interface UploadMediaInput {
  title?: string
  altText?: string
  bucket: string
  file: File
}
