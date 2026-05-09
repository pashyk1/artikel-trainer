import { useState } from 'react'
import words from '../data/words'

export default function Search({ t, lang }) {
  const [query, setQuery] = useState('')

  const getDescription = (w) => {
    if (lang === 'ru') return w.ru
    if (lang === 'en') return w.en
    return w.de  // German: show German definition
  }

  const results = query.trim()
    ? words.filter(w => w.word.toLowerCase().startsWith(query.trim().toLowerCase())).slice(0, 4)
    : []

  const caseKeys = [
    { key: 'N', label: t.caseN },
    { key: 'G', label: t.caseG },
    { key: 'D', label: t.caseD },
    { key: 'A', label: t.caseA },
  ]

  return (
    <div>
      <div className={`search-hero${query ? ' search-hero--compact' : ''}`}>
        <h1 className="hero-title">{t.heroTitle}</h1>
        {!query && <p className="hero-sub">{t.heroSub}</p>}
      </div>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="clear-btn" onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      {query && results.length === 0 && (
        <div className="no-result">{t.noResult}</div>
      )}

      {results.map(w => (
        <div key={w.word} className="result-card">
          <span className={`article-badge badge-${w.article}`}>{w.article}</span>
          <div className="word-main">{w.word}</div>
          <div className="word-sub">{getDescription(w)}</div>

          <div className="decl-divider" />
          <div className="decl-label">{t.declension}</div>
          <div className="decl-grid">
            {caseKeys.map(({ key, label }) => (
              <div key={key} className="decl-cell">
                <div className="decl-case">{label}</div>
                <div className="decl-form">{w.decl[key]}</div>
                {w.examples?.[key] && (
                  <div className="decl-example">{w.examples[key]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
