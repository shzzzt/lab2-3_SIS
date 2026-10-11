import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import clsx from 'clsx'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  help?: string
  /** Keep the label for assistive technology but hide it visually. */
  hideLabel?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, error, help, hideLabel = false, required, className, children, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId
    const errorId = `${selectId}-error`
    const helpId = `${selectId}-help`
    const describedBy = [error ? errorId : null, help ? helpId : null]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className={hideLabel ? undefined : 'space-y-1.5'}>
        {label && (
          <label className={hideLabel ? 'sr-only' : 'label'} htmlFor={selectId}>
            {label}
            {required && <span className="ml-0.5 text-rose-600" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={clsx('input', error && 'input-error', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {children}
        </select>
        {help && !error && <p id={helpId} className="help-text">{help}</p>}
        {error && <p id={errorId} className="error-text">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'

export default Select
