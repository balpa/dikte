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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <p className="text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
