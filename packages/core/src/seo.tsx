import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export interface DocumentSeoOptions {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
  siteName?: string
  siteUrl?: string
  canonicalPath?: string
}

function normalizeSiteUrl(siteUrl: string | undefined): string | undefined {
  if (!siteUrl) return undefined
  if (siteUrl.startsWith('http://') || siteUrl.startsWith('https://')) return siteUrl
  return `https://${siteUrl}`
}

function buildDocumentTitle(title: string | undefined, siteName: string | undefined): string | undefined {
  const trimmedTitle = title?.trim()
  const trimmedSiteName = siteName?.trim()
  if (trimmedTitle && trimmedSiteName) {
    return trimmedTitle.includes(trimmedSiteName) ? trimmedTitle : `${trimmedTitle} | ${trimmedSiteName}`
  }
  return trimmedTitle || trimmedSiteName || undefined
}

function upsertMetaByName(name: string, content: string | undefined) {
  if (typeof document === 'undefined') return
  let meta = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!content) {
    meta?.remove()
    return
  }
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function upsertMetaByProperty(property: string, content: string | undefined) {
  if (typeof document === 'undefined') return
  let meta = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!content) {
    meta?.remove()
    return
  }
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function upsertCanonical(url: string | undefined) {
  if (typeof document === 'undefined') return
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!url) {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

export function useDocumentSeo(options: DocumentSeoOptions) {
  const location = useLocation()

  useEffect(() => {
    if (typeof document === 'undefined') return

    const siteUrl = normalizeSiteUrl(options.siteUrl)
    const imageUrl = options.image?.trim()
    const description = options.description?.trim()
    const canonicalPath = options.canonicalPath ?? `${location.pathname}${location.search}`
    const canonicalUrl = siteUrl ? new URL(canonicalPath, siteUrl).toString() : undefined
    const title = buildDocumentTitle(options.title, options.siteName)
    const type = options.type ?? 'website'

    if (title) document.title = title

    upsertMetaByName('description', description)
    upsertMetaByProperty('og:title', title)
    upsertMetaByProperty('og:description', description)
    upsertMetaByProperty('og:type', type)
    upsertMetaByProperty('og:url', canonicalUrl)
    upsertMetaByProperty('og:image', imageUrl)
    upsertMetaByName('twitter:card', imageUrl ? 'summary_large_image' : 'summary')
    upsertMetaByName('twitter:title', title)
    upsertMetaByName('twitter:description', description)
    upsertMetaByName('twitter:image', imageUrl)
    upsertCanonical(canonicalUrl)
  }, [
    location.pathname,
    location.search,
    options.canonicalPath,
    options.description,
    options.image,
    options.siteName,
    options.siteUrl,
    options.title,
    options.type,
  ])
}
