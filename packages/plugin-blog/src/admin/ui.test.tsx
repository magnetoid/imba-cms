import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui'

/**
 * `SelectValue` used to return `null`, dropping the placeholder entirely. That
 * was not cosmetic: with `value=''` and no matching option, a native select
 * displays its *first* option while React state stays empty — so the editor saw
 * "Design" selected and saved `null` for category_id.
 */

function renderSelect(props: { value?: string; onValueChange?: (v: string) => void }) {
  return render(
    <Select {...props}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="engineering">Engineering</SelectItem>
      </SelectContent>
    </Select>,
  )
}

describe('Select', () => {
  it('shows the placeholder when nothing is selected', () => {
    renderSelect({ value: '' })
    expect(screen.getByRole('option', { name: 'Select category' })).toBeDefined()
  })

  it('does not display an option the form state does not hold', () => {
    // The bug: the control read "Design" while value was ''.
    renderSelect({ value: '' })
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
    expect(select.selectedOptions[0]?.textContent).not.toBe('Design')
  })

  it('renders every item as an option', () => {
    renderSelect({ value: 'design' })
    expect(screen.getByRole('option', { name: 'Design' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Engineering' })).toBeDefined()
  })

  it('omits the placeholder once a real value is selected', () => {
    renderSelect({ value: 'design' })
    expect(screen.queryByRole('option', { name: 'Select category' })).toBeNull()
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('design')
  })

  it('reports the chosen value', () => {
    const onValueChange = vi.fn()
    renderSelect({ value: '', onValueChange })

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'engineering' } })
    expect(onValueChange).toHaveBeenCalledWith('engineering')
  })

  it('shows a placeholder option for a value with no matching item', () => {
    // e.g. a category that was deleted since the post was written.
    renderSelect({ value: 'deleted-category' })
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('tolerates an undefined value', () => {
    renderSelect({})
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('')
  })
})
