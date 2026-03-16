import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function Modal({ open, message, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="rounded-2xl p-6 max-w-sm mx-4"
        style={{
          background: '#2c2c2e',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
        }}
      >
        <p className="text-sm mb-5" style={{ color: '#f5f5f7' }}>{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs rounded-lg transition-all duration-150"
            style={{ color: '#86868b' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium rounded-lg transition-all duration-150"
            style={{
              background: '#0a84ff',
              color: '#fff',
            }}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
