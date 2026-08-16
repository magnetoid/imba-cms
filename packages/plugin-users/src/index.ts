import { lazy } from 'react'
import { CMS_CAPABILITIES, definePlugin } from '@imba/core'
import { configureUsersClient } from './client'

const UsersAdmin = lazy(async () => import('./admin/UsersAdmin'))

/**
 * User and role management. Has no tables or migrations of its own: it
 * administers core's `cms_user_roles` through `@imba/settings-server`, which
 * holds the service-role key needed to read GoTrue's user directory and to
 * send invitations.
 */
const users = definePlugin({
  name: 'users',
  version: '0.1.0',
  admin: {
    nav: { group: 'System', label: 'Users', path: '/admin/users', requiredCapabilities: [CMS_CAPABILITIES.usersManage] },
    pages: [
      { path: '/admin/users', element: UsersAdmin, requiredCapabilities: [CMS_CAPABILITIES.usersManage] },
    ],
  },
  register(ctx) {
    configureUsersClient({ auth: ctx.auth })
  },
})

export default users
export { configureUsersClient } from './client'
export { fetchUsers, inviteUser, setUserRole } from './api'
export type { ManagedUser } from './types'
