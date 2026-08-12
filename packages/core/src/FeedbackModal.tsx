import { useState } from 'react'
import { useCmsSession } from './session'
import type { SupabaseClient } from '@supabase/supabase-js'

export function FeedbackModal({ db }: { db: SupabaseClient }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const session = useCmsSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('submitting')
    
    const { error } = await db.from('cms_feedback').insert({
      user_id: session?.user.id,
      message,
    })

    if (error) {
      console.error(error)
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(() => {
        setOpen(false)
        setMessage('')
        setStatus('idle')
      }, 2000)
    }
  }

  return (
    <>
      <button 
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg hover:bg-primary/90 transition-colors z-50 text-sm font-medium"
      >
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Provide Feedback</h2>
              <button 
                type="button" 
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Notice a bug? Have a feature request? Let us know.
              </p>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                required
                disabled={status === 'submitting' || status === 'success'}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />

              {status === 'error' && (
                <p className="text-sm text-destructive">Failed to submit feedback. Please try again.</p>
              )}
              {status === 'success' && (
                <p className="text-sm text-green-600">Thank you! Your feedback has been submitted.</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting' || status === 'success' || !message.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
