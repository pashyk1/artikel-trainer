import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Search({ t, lang }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const getDescription = (w) => {
    if (lang === 'ru') return w.translation_ru || ''
    if (lang === 'en') return w.translation_en || ''
    return ''
  }

  const caseKeys = [
    { key: 'N', label: t.caseN },
    { key: 'G', label: t.caseG },
    { key: 'D', label: t.caseD },
    { key: 'A', label: t.caseA },
  ]

  // Поиск срабатывает через 300мс после остановки печати и минимум 3 символа
  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 3) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('words')
        .select('*')
        .ilike('word', `${trimmed}%`)
        .order('word')
        .limit(5)

      if (!error) setResults(data || [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

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
          <button className="clear-btn" onClick={() => { setQuery(''); setResults([]) }}>✕</button>
        )}
      </div>

      {query.trim().length > 0 && query.trim().length < 3 && (
        <div className="no-result">{t.typeMore || 'Введи минимум 3 буквы...'}</div>
      )}

      {loading && (
        <div className="no-result">...</div>
      )}

      {!loading && query.trim().length >= 3 && results.length === 0 && (
        <div className="no-result">{t.noResult}</div>
      )}

      {results.map(w => (
        <div key={w.id} className="result-card">
          <span className={`article-badge badge-${w.article}`}>{w.article}</span>
          <div className="word-main">{w.word}</div>
          {getDescription(w) && (
            <div className="word-sub">{getDescription(w)}</div>
          )}
          {w.plural && (
            <div className="word-sub">Pl: {w.plural}</div>
          )}

          {w.decl && (
            <>
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
            </>
          )}
        </div>
      ))}
    </div>
  )
}
