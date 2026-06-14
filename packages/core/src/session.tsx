import { createContext, useContext } from 'react'
import type { CmsSession } from './types'

const CmsSessionContext = createContext<CmsSession | null>(null)

export function CmsSessionProvider({
  session,
  children,
}: {
  session: CmsSession | null
  children: React.ReactNode
}) {
  return (
    <CmsSessionContext.Provider value={session}>
      {children}
    </CmsSessionContext.Provider>
  )
}

export function useCmsSession() {
  return useContext(CmsSessionContext)
}
