import { useState, useRef, useEffect } from 'react'
import Search from './components/Search'
import Quiz from './components/Quiz'
import Stats from './components/Stats'
import translations from './i18n/translations'

const TABS = ['search', 'quiz', 'stats']

const LANGUAGES = [
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'pl', label: 'Polski',     flag: '🇵🇱' },
  { code: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
]

function LangDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGUAGES.find(l => l.code === lang)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="lang-dropdown" ref={ref}>
      <button className="lang-trigger" onClick={() => setOpen(o => !o)}>
        <span>{current.flag}</span>
        <span className="lang-code">{current.code.toUpperCase()}</span>
        <span className="lang-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="lang-menu">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`lang-option${l.code === lang ? ' selected' : ''}`}
              onClick={() => { setLang(l.code); setOpen(false) }}
            >
              <span className="lang-option-flag">{l.flag}</span>
              <span className="lang-option-label">{l.label}</span>
              {l.code === lang && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState('de')
  const [tab, setTab]   = useState('search')
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, known: new Set() })

  const t = translations[lang]

  const handleAnswer = (isCorrect, word) => {
    setStats(prev => {
      const known = new Set(prev.known)
      if (isCorrect) known.add(word)
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total:   prev.total + 1,
        streak:  isCorrect ? prev.streak + 1 : 0,
        known,
      }
    })
  }

  return (
    <div>
      <div className="header-wrapper">
        <header className="header-card">
          <div className="logo">Artikel<span className="logo-dot">.</span>trainer</div>
          <nav className="nav-links">
            {TABS.map(id => (
              <button
                key={id}
                className={`nav-link${tab === id ? ' active' : ''}`}
                onClick={() => setTab(id)}
              >
                {{ search: t.tabSearch, quiz: t.tabQuiz, stats: t.tabStats }[id]}
              </button>
            ))}
          </nav>
          <LangDropdown lang={lang} setLang={setLang} />
        </header>
      </div>

      <div className="app">
        <main>
          {tab === 'search' && <Search t={t} lang={lang} />}
          {tab === 'quiz'   && <Quiz   t={t} lang={lang} onAnswer={handleAnswer} />}
          {tab === 'stats'  && <Stats  t={t} stats={stats} />}
        </main>
      </div>
    </div>
  )
}
