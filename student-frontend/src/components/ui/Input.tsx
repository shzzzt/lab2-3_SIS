import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  help?: string
  /** Keep the label for assistive technology but hide it visually. */
  hideLabel?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, help, hideLabel = false, required, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`
    const describedBy = [error ? errorId : null, help ? helpId : null]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className={hideLabel ? undefined : 'space-y-1.5'}>
        {label && (
          <label className={hideLabel ? 'sr-only' : 'label'} htmlFor={inputId}>
            {label}
            {required && <span className="ml-0.5 text-rose-600" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={clsx('input', error && 'input-error', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {help && !error && <p id={helpId} className="help-text">{help}</p>}
        {error && <p id={errorId} className="error-text">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
