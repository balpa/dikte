import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')
  }

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
      style={{
        background: 'rgba(255,255,255,0.04)',
        color: '#86868b',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      title="Switch language / Dil değiştir"
    >
      {i18n.language === 'tr' ? 'EN' : 'TR'}
    </button>
  )
}
