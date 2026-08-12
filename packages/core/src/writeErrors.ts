/**
 * Turns a Postgres/PostgREST write failure into something an editor can act on.
 *
 * When RLS refuses a write, Supabase surfaces `42501` with
 * "new row violates row-level security policy for table ..." — accurate, and
 * useless to the person who just lost their edit. Since the capability model is
 * now enforced in the database (core V006 + the per-plugin V002 policies), a
 * denial almost always means the signed-in role lacks one specific capability,
 * so say which.
 */

/** The shape Supabase returns; kept structural so no client type is needed. */
export interface WriteErrorLike {
  message?: string
  code?: string
  details?: string
  hint?: string
}

const RLS_CODE = '42501'
const RLS_MESSAGE = /row-level security|violates row-level security policy|insufficient privilege/i

export function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as WriteErrorLike
  if (candidate.code === RLS_CODE) return true
  return typeof candidate.message === 'string' && RLS_MESSAGE.test(candidate.message)
}

/**
 * @param entity   Human label for what was being saved, e.g. `'page'`.
 * @param required The capability the operation needs, e.g. `'pages.write'`.
 */
export function describeWriteError(
  error: unknown,
  entity: string,
  required?: string,
): string {
  if (isPermissionDenied(error)) {
    const capability = required ? ` It requires the "${required}" capability.` : ''
    return (
      `You do not have permission to save this ${entity}.${capability} ` +
      `Ask an administrator to review your role.`
    )
  }

  if (error instanceof Error && error.message) return error.message

  const candidate = error as WriteErrorLike | null
  if (candidate && typeof candidate.message === 'string' && candidate.message) {
    return candidate.message
  }

  return `Failed to save ${entity}.`
}

/**
 * An UPDATE whose `USING` clause rejects the row is not an error — PostgREST
 * reports success with zero rows affected, so the save silently does nothing.
 * Callers that `.select()` back a row can use this to catch that case.
 */
export function describeSilentDenial(entity: string, required?: string): string {
  const capability = required ? ` It requires the "${required}" capability.` : ''
  return (
    `The ${entity} was not saved: the database rejected the change.${capability} ` +
    `Ask an administrator to review your role.`
  )
}
