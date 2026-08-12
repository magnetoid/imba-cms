import { useEffect, useState } from 'react'
import { CMS_CAPABILITIES, describeSilentDenial, describeWriteError, hasCapability, useCmsSession } from '@imba/core'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@imba/ui'
import { buildDefaultSiteSettingsRecord } from '../defaults'
import { siteDb } from '../public/siteClient'
import { parseSiteSettingsContent, PRIMARY_SITE_SETTINGS_SLUG } from '../types'
import type { SiteSettingsStatus } from '../types'

interface SiteSettingsRow {
  id: string
  slug: string
  title: string
  status: string
  content: unknown
  updated_at?: string
  published_at?: string | null
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return 'Seed default'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString()
}

export default function SiteAdmin() {
  const session = useCmsSession()
  const canWrite = hasCapability(session, CMS_CAPABILITIES.siteWrite)
  const canPublish = hasCapability(session, CMS_CAPABILITIES.sitePublish)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [title, setTitle] = useState('Public Site')
  const [status, setStatus] = useState<SiteSettingsStatus>('draft')
  const [brandName, setBrandName] = useState('')
  const [brandAccent, setBrandAccent] = useState('')
  const [homePath, setHomePath] = useState('/')
  const [contactEmail, setContactEmail] = useState('')
  const [copyright, setCopyright] = useState('')
  const [platformNote, setPlatformNote] = useState('')
  const [contactBlurb, setContactBlurb] = useState('')
  const [navLinksText, setNavLinksText] = useState('[]')
  const [navCtaText, setNavCtaText] = useState('null')
  const [footerNavLinksText, setFooterNavLinksText] = useState('[]')
  const [socialLinksText, setSocialLinksText] = useState('[]')
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined)

  useEffect(() => {
    let active = true

    siteDb()
      .from('site_entries')
      .select('id, slug, title, status, content, updated_at, published_at')
      .eq('slug', PRIMARY_SITE_SETTINGS_SLUG)
      .maybeSingle<SiteSettingsRow>()
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) {
          setError(loadError.message)
          setLoading(false)
          return
        }

        const settings = data
          ? {
              ...buildDefaultSiteSettingsRecord(),
              id: data.id,
              title: data.title,
              status: (data.status === 'published' ? 'published' : 'draft') as SiteSettingsStatus,
              content: parseSiteSettingsContent(data.content),
              updatedAt: data.updated_at,
              publishedAt: data.published_at ?? null,
            }
          : buildDefaultSiteSettingsRecord()

        setTitle(settings.title)
        setStatus(settings.status)
        setBrandName(settings.content.brand.name)
        setBrandAccent(settings.content.brand.accent)
        setHomePath(settings.content.brand.homePath)
        setContactEmail(settings.content.footer.contactEmail)
        setCopyright(settings.content.footer.copyright)
        setPlatformNote(settings.content.footer.platformNote)
        setContactBlurb(settings.content.footer.contactBlurb)
        setNavLinksText(prettyJson(settings.content.navLinks))
        setNavCtaText(prettyJson(settings.content.navCta ?? null))
        setFooterNavLinksText(prettyJson(settings.content.footer.navLinks))
        setSocialLinksText(prettyJson(settings.content.footer.socialLinks))
        setUpdatedAt(settings.updatedAt)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function restoreDefaults() {
    const settings = buildDefaultSiteSettingsRecord()
    setTitle(settings.title)
    setStatus(settings.status)
    setBrandName(settings.content.brand.name)
    setBrandAccent(settings.content.brand.accent)
    setHomePath(settings.content.brand.homePath)
    setContactEmail(settings.content.footer.contactEmail)
    setCopyright(settings.content.footer.copyright)
    setPlatformNote(settings.content.footer.platformNote)
    setContactBlurb(settings.content.footer.contactBlurb)
    setNavLinksText(prettyJson(settings.content.navLinks))
    setNavCtaText(prettyJson(settings.content.navCta ?? null))
    setFooterNavLinksText(prettyJson(settings.content.footer.navLinks))
    setSocialLinksText(prettyJson(settings.content.footer.socialLinks))
    setNotice('')
    setError('')
  }

  async function handleSave() {
    if (!canWrite) {
      setError('You do not have permission to edit site settings.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const parsedContent = parseSiteSettingsContent({
        brand: {
          name: brandName.trim(),
          accent: brandAccent.trim(),
          homePath: homePath.trim(),
        },
        navLinks: JSON.parse(navLinksText) as unknown,
        navCta: JSON.parse(navCtaText) as unknown,
        footer: {
          contactEmail: contactEmail.trim(),
          contactBlurb: contactBlurb.trim(),
          copyright: copyright.trim(),
          platformNote: platformNote.trim(),
          navLinks: JSON.parse(footerNavLinksText) as unknown,
          socialLinks: JSON.parse(socialLinksText) as unknown,
        },
      })

      const nextStatus = canPublish ? status : 'draft'
      const publishedAt = nextStatus === 'published' ? new Date().toISOString() : null
      const { data, error: saveError } = await siteDb()
        .from('site_entries')
        .upsert({
          slug: PRIMARY_SITE_SETTINGS_SLUG,
          title: title.trim() || 'Public Site',
          status: nextStatus,
          content: parsedContent,
          published_at: publishedAt,
        }, { onConflict: 'slug' })
        .select('updated_at')
        .maybeSingle<{ updated_at?: string }>()

      if (saveError) throw saveError

      // An UPDATE whose RLS `USING` clause rejects the row is not an error:
      // PostgREST reports success with zero rows affected. Without this check
      // the UI would say "saved" for a write the database refused.
      if (!data) {
        setError(describeSilentDenial('site settings', 'site.write'))
        return
      }

      setStatus(nextStatus)
      setUpdatedAt(data.updated_at)
      setNotice('Site settings saved.')
    } catch (saveError) {
      setError(describeWriteError(saveError, 'site settings', 'site.write'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading site settings…</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Site Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the preserved public shell content without changing the existing front-end structure.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={restoreDefaults}>
            Reset to defaults
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !canWrite}>
            {saving ? 'Saving…' : 'Save site settings'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Public shell content</CardTitle>
            <CardDescription>
              Brand, nav, footer, and contact metadata are stored here and merged into the preserved mtiosavljevic theme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site-title">Record title</Label>
                <Input id="site-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-status">Status</Label>
                <select
                  id="site-status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={status}
                  onChange={(event) => setStatus(event.target.value === 'published' ? 'published' : 'draft')}
                  disabled={!canPublish}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand name</Label>
                <Input id="brand-name" value={brandName} onChange={(event) => setBrandName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-accent">Brand accent</Label>
                <Input id="brand-accent" value={brandAccent} onChange={(event) => setBrandAccent(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-home-path">Home path</Label>
                <Input id="brand-home-path" value={homePath} onChange={(event) => setHomePath(event.target.value)} />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site-contact-email">Contact email</Label>
                <Input id="site-contact-email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-copyright">Copyright</Label>
                <Input id="site-copyright" value={copyright} onChange={(event) => setCopyright(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-platform-note">Platform note</Label>
              <textarea
                id="site-platform-note"
                className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={platformNote}
                onChange={(event) => setPlatformNote(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-contact-blurb">Footer contact note</Label>
              <textarea
                id="site-contact-blurb"
                className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={contactBlurb}
                onChange={(event) => setContactBlurb(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-nav-links">Primary navigation JSON</Label>
              <textarea
                id="site-nav-links"
                className="min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={navLinksText}
                onChange={(event) => setNavLinksText(event.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-nav-cta">Navigation CTA JSON</Label>
              <textarea
                id="site-nav-cta"
                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={navCtaText}
                onChange={(event) => setNavCtaText(event.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-footer-nav-links">Footer navigation JSON</Label>
              <textarea
                id="site-footer-nav-links"
                className="min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={footerNavLinksText}
                onChange={(event) => setFooterNavLinksText(event.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-social-links">Social links JSON</Label>
              <textarea
                id="site-social-links"
                className="min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={socialLinksText}
                onChange={(event) => setSocialLinksText(event.target.value)}
                spellCheck={false}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {notice && <p className="text-sm text-emerald-600">{notice}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Keep the current public design, move the shell data into the CMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground">Public fallback</div>
              <p>If this record is missing or still draft, the preserved old-site defaults remain live.</p>
            </div>
            <div>
              <div className="font-medium text-foreground">Publish control</div>
              <p>Writers can stage changes as draft. Only users with publish access can ship them to the public theme.</p>
            </div>
            <div>
              <div className="font-medium text-foreground">Updated</div>
              <p>{formatUpdatedAt(updatedAt)}</p>
            </div>
            <div>
              <div className="font-medium text-foreground">JSON shape</div>
              <p>Each nav item needs either `to` for internal routes or `href` for external links.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
