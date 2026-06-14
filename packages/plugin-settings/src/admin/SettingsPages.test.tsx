import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsHome from './SettingsHome'
import GraphQLSettingsPage from './GraphQLSettingsPage'
import McpSettingsPage from './McpSettingsPage'

const apiMocks = vi.hoisted(() => ({
  fetchGraphqlSettings: vi.fn(),
  updateGraphqlSettings: vi.fn(),
  runGraphqlConnectionTest: vi.fn(),
  fetchMcpSettings: vi.fn(),
  updateMcpSettings: vi.fn(),
  runMcpConnectionTest: vi.fn(),
  graphqlResponse: {
    enabled: true,
    endpointUrl: 'https://api.example.com/graphql',
    authMode: 'none',
    token: '',
    username: '',
    password: '',
    timeoutMs: 5000,
    hasToken: false,
    hasPassword: false,
  },
  mcpResponse: {
    enabled: true,
    endpointUrl: 'https://automation.example.com/mcp',
    authMode: 'none',
    token: '',
    username: '',
    password: '',
    timeoutMs: 5000,
    transport: 'streamable-http',
    hasToken: false,
    hasPassword: false,
  },
}))

vi.mock('../api', () => apiMocks)

describe('settings admin pages', () => {
  beforeEach(() => {
    apiMocks.fetchGraphqlSettings.mockResolvedValue(apiMocks.graphqlResponse)
    apiMocks.updateGraphqlSettings.mockImplementation(async (value) => ({ ...value, hasToken: false, hasPassword: false }))
    apiMocks.runGraphqlConnectionTest.mockResolvedValue({ ok: true, message: 'Connected to GraphQL.' })
    apiMocks.fetchMcpSettings.mockResolvedValue(apiMocks.mcpResponse)
    apiMocks.updateMcpSettings.mockImplementation(async (value) => ({ ...value, hasToken: false, hasPassword: false }))
    apiMocks.runMcpConnectionTest.mockResolvedValue({ ok: true, message: 'Connected to MCP.' })
  })

  it('renders the settings overview with GraphQL and MCP links', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <SettingsHome />
      </MemoryRouter>,
    )

    expect(await screen.findByText('GraphQL configuration')).toBeDefined()
    expect(screen.getByText('MCP server configuration')).toBeDefined()
  })

  it('saves and tests GraphQL configuration', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/graphql']}>
        <GraphQLSettingsPage />
      </MemoryRouter>,
    )

    const endpoint = await screen.findByLabelText('Server URL')
    fireEvent.change(endpoint, { target: { value: 'https://api.changed.com/graphql' } })
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))

    await waitFor(() => {
      expect(apiMocks.runGraphqlConnectionTest).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Connected to GraphQL.')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(apiMocks.updateGraphqlSettings).toHaveBeenCalledTimes(1)
    })
  })

  it('saves and tests MCP configuration', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/mcp']}>
        <McpSettingsPage />
      </MemoryRouter>,
    )

    const endpoint = await screen.findByLabelText('Server URL')
    fireEvent.change(endpoint, { target: { value: 'https://automation.changed.com/mcp' } })
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))

    await waitFor(() => {
      expect(apiMocks.runMcpConnectionTest).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Connected to MCP.')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(apiMocks.updateMcpSettings).toHaveBeenCalledTimes(1)
    })
  })
})
