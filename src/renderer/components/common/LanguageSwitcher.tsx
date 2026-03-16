import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')
  }

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
      title="Switch language / Dil değiştir"
    >
      {i18n.language === 'tr' ? 'EN' : 'TR'}
    </button>
  )
}
