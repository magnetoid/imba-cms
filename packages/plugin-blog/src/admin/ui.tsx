// ─────────────────────────────────────────────────────────────────────────
// Local UI shim for @imba/plugin-blog admin pages.
//
// @imba/ui only exports { cn, Button, Input, Label, Card* }. The extracted
// admin components additionally use Textarea, Badge, Switch, the Table family,
// the Dialog family, the Select family, and Separator. Rather than pull a full
// design system into the plugin, these are minimal, dependency-free,
// plain-HTML implementations with the same prop surface the admin pages use.
// The host CMS can later map these to its real design system.
// ─────────────────────────────────────────────────────────────────────────
import * as React from 'react'
import { cn } from '@imba/ui'

export { Button, Input, Label, cn } from '@imba/ui'

// ── Textarea ────────────────────────────────────────────────────────────
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

// ── Badge ───────────────────────────────────────────────────────────────
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}
export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-input',
    destructive: 'bg-destructive text-destructive-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

// ── Switch ──────────────────────────────────────────────────────────────
export interface SwitchProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}
export function Switch({ id, checked = false, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors',
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
    >
      <span
        className={cn(
          'block h-4 w-4 rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ── Separator ───────────────────────────────────────────────────────────
export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border', className)} />
}

// ── Table family ────────────────────────────────────────────────────────
type DivLike<T> = React.HTMLAttributes<T>
export const Table = ({ className, ...props }: DivLike<HTMLTableElement>) => (
  <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
)
export const TableHeader = (props: DivLike<HTMLTableSectionElement>) => <thead {...props} />
export const TableBody = (props: DivLike<HTMLTableSectionElement>) => <tbody {...props} />
export const TableRow = ({ className, ...props }: DivLike<HTMLTableRowElement>) => (
  <tr className={cn('border-b transition-colors hover:bg-muted/50', className)} {...props} />
)
export const TableHead = ({ className, ...props }: DivLike<HTMLTableCellElement>) => (
  <th className={cn('h-10 px-2 text-left align-middle font-medium text-muted-foreground', className)} {...props} />
)
export const TableCell = ({ className, ...props }: DivLike<HTMLTableCellElement>) => (
  <td className={cn('p-2 align-middle', className)} {...props} />
)

// ── Dialog family ───────────────────────────────────────────────────────
interface DialogContextValue {
  open: boolean
  onOpenChange?: (open: boolean) => void
}
const DialogContext = React.createContext<DialogContextValue>({ open: false })

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
        {children}
      </div>
    </DialogContext.Provider>
  )
}
export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative z-50 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg', className)}>
      {children}
    </div>
  )
}
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-col gap-1.5">{children}</div>
}
export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
}
export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex justify-end gap-2">{children}</div>
}

// ── Select family ───────────────────────────────────────────────────────
// Minimal native-<select>-backed implementation. The shadcn Select API is
// reshaped: Select wraps a native select, and the SelectItem children declare
// the available options. Trigger/Value/Content are accepted but render nothing
// structural — the native control carries everything.
interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
}
const SelectCtx = React.createContext<SelectContextValue>({})

function collectItems(node: React.ReactNode): React.ReactElement<SelectItemProps>[] {
  const items: React.ReactElement<SelectItemProps>[] = []
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === SelectItem) {
      items.push(child as React.ReactElement<SelectItemProps>)
    } else if (child.props && (child.props as { children?: React.ReactNode }).children) {
      items.push(...collectItems((child.props as { children?: React.ReactNode }).children))
    }
  })
  return items
}

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}) {
  const items = collectItems(children)
  return (
    <SelectCtx.Provider value={{ value, onValueChange }}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {items.map((item) => (
          <option key={item.props.value} value={item.props.value}>
            {typeof item.props.children === 'string' ? item.props.children : item.props.value}
          </option>
        ))}
      </select>
    </SelectCtx.Provider>
  )
}
export function SelectTrigger({ children }: { className?: string; children?: React.ReactNode }) {
  return <>{children}</>
}
export function SelectValue(_props: { placeholder?: string }) {
  return null
}
export function SelectContent({ children }: { children?: React.ReactNode }) {
  // Children (SelectItem) are read by the parent Select via collectItems; we
  // still render them so they participate in the tree, but hidden.
  return <span style={{ display: 'none' }}>{children}</span>
}
interface SelectItemProps {
  value: string
  children?: React.ReactNode
}
export function SelectItem(_props: SelectItemProps) {
  return null
}
