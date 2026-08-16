// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { CMS_CAPABILITIES } from '@imba/core'
import users from './index'

describe('@imba/plugin-users', () => {
  it('registers a users.manage-gated admin page under System', () => {
    expect(users.name).toBe('users')
    expect(users.admin?.nav).toMatchObject({ group: 'System', path: '/admin/users', requiredCapabilities: [CMS_CAPABILITIES.usersManage] })
    expect(users.admin?.pages.map((p) => p.path)).toEqual(['/admin/users'])
    expect(users.migrations ?? []).toEqual([])
  })
})
