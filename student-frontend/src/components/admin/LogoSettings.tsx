import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import brandingApi, { brandingQueryKey, type SystemSettings } from '../../api/branding'
import { getApiErrorMessage, getValidationErrors } from '../../api/errors'
import { useToast } from '../../contexts/ToastContext'
import BrandMark from '../branding/BrandMark'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Icon from '../ui/Icon'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 512 * 1024

type LogoSettingsProps = {
  logo: string | null
  institutionName: string
}

export default function LogoSettings({ logo, institutionName }: LogoSettingsProps) {
  const cache = useQueryClient()
  const { showToast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const applySettings = async (settings: SystemSettings): Promise<void> => {
    cache.setQueryData(['system-settings'], settings)
    await cache.invalidateQueries({ queryKey: brandingQueryKey })
  }

  const upload = useMutation({
    mutationFn: brandingApi.uploadLogo,
    onSuccess: async (settings) => { await applySettings(settings); showToast('Logo updated.', 'success') },
    onError: (requestError: unknown) => setError(getValidationErrors(requestError).logo?.[0] ?? getApiErrorMessage(requestError, 'Could not upload the logo.')),
  })

  const remove = useMutation({
    mutationFn: brandingApi.removeLogo,
    onSuccess: async (settings) => { await applySettings(settings); setConfirmRemove(false); showToast('Logo removed.', 'success') },
    onError: (requestError: unknown) => { setConfirmRemove(false); setError(getApiErrorMessage(requestError, 'Could not remove the logo.')) },
  })

  const handleFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setError(null)
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`That image is ${(file.size / 1024).toFixed(0)} KB. Please choose one that is 512 KB or smaller.`)
      return
    }
    upload.mutate(file)
  }

  const busy = upload.isPending || remove.isPending

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className="rounded-[1.75rem] border border-dashed border-stone-300 bg-canvas p-3">
          <BrandMark size="xl" logo={logo} name={institutionName} decorative={false} />
        </span>
        <span className="text-xs text-stone-600">{logo ? 'Current logo' : 'Monogram (no logo yet)'}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        <p className="help-text">
          Shown in the sidebar, on the sign-in page and as the browser tab icon. Square image, at least 128×128 px,
          PNG with transparent background works best. PNG, JPEG or WebP, up to 512 KB.
        </p>
        <input
          ref={fileInput}
          id="logo-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-describedby={error ? 'logo-error' : undefined}
          onChange={handleFile}
          tabIndex={-1}
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" loading={upload.isPending} disabled={busy} onClick={() => fileInput.current?.click()}>
            {!upload.isPending && <Icon name="upload" size={17} />}
            {logo ? 'Replace logo' : 'Upload logo'}
          </Button>
          {logo && (
            <Button variant="quiet-danger" disabled={busy} onClick={() => setConfirmRemove(true)}>
              <Icon name="trash" size={17} />
              Remove logo
            </Button>
          )}
        </div>
        {error && <p id="logo-error" className="alert-error" role="alert">{error}</p>}
      </div>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove the logo?"
        message="The sidebar and sign-in page will show the institution's initials instead. You can upload a new logo at any time."
        confirmLabel="Remove logo"
        loading={remove.isPending}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}
