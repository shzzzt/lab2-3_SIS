import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

export default function Modal({ open, title, description, onClose, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const descriptionId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  // Move focus into the dialog when it opens and give it back when it closes.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-modal-close])')?.focus()
    return () => previous?.focus()
  }, [open])

  if (!open) {
    return null
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        ref={dialogRef}
        className={`flex max-h-[92vh] w-full animate-fade-up flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-stone-900">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-stone-600">{description}</p>}
          </div>
          <button
            type="button"
            data-modal-close
            className="-mr-2 -mt-1 rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <footer className="flex flex-col-reverse gap-2 border-t border-stone-100 bg-stone-50/70 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:rounded-b-2xl">{footer}</footer>}
      </section>
    </div>
  )

  return createPortal(modal, document.body)
}
