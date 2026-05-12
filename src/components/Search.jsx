import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const GEMINI_KEY = 'AIzaSyASBV6fe-yeKDir4fXHIBWT8AQfPfafZac'

async function fetchWordDetails(word, article, lang) {
  const langInstruction = {
    ru: 'Дай краткое описание на русском языке (1 предложение).',
    en: 'Give a short description in English (1 sentence).',
    de: 'Gib eine kurze Beschreibung auf Deutsch (1 Satz).',
  }[lang] || 'Gib eine kurze Beschreibung auf Deutsch (1 Satz).'

  const prompt = `Du bist ein Deutschlehrer. Das Wort ist: "${article} ${word}".

${langInstruction}

Gib außerdem die vier Deklinationsformen im Singular mit je einem natürlichen Beispielsatz.

Antworte NUR mit diesem JSON, ohne Erklärungen, ohne Markdown:
{
  "description": "...",
  "decl": {
    "N": { "form": "${article} ${word}", "example": "..." },
    "G": { "form": "...", "example": "..." },
    "D": { "form": "...", "example": "..." },
    "A": { "form": "...", "example": "..." }
  }
}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  )
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

const CASE_LABELS = {
  de: { N: 'Nominativ',   G: 'Genitiv',   D: 'Dativ',  A: 'Akkusativ'  },
  ru: { N: 'Именит.',     G: 'Родит.',     D: 'Дат.',   A: 'Винит.'     },
  en: { N: 'Nominative',  G: 'Genitive',   D: 'Dative', A: 'Accusative' },
}

export default function Search({ t, lang }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(null)   // word currently expanded
  const [details, setDetails]   = useState({})     // cache per word
  const cache = useRef({})

  // ── Поиск в Supabase ──────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) { setResults([]); setExpanded(null); return }

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

  // ── Клик по карточке — загрузить детали ──────────────────
  const handleCardClick = async (w) => {
    // Если уже открыта — закрыть
    if (expanded === w.word) { setExpanded(null); return }
    setExpanded(w.word)

    // Если уже в кеше — просто открыть
    if (cache.current[w.word]) {
      setDetails(d => ({ ...d, [w.word]: cache.current[w.word] }))
      return
    }

    // Загрузить через Gemini
    setDetails(d => ({ ...d, [w.word]: { status: 'loading' } }))
    try {
      const data = await fetchWordDetails(w.word, w.article, lang)
      cache.current[w.word] = { status: 'done', data }
      setDetails(d => ({ ...d, [w.word]: { status: 'done', data } }))
    } catch {
      setDetails(d => ({ ...d, [w.word]: { status: 'error' } }))
    }
  }

  const caseKeys   = ['N', 'G', 'D', 'A']
  const caseLabels = CASE_LABELS[lang] || CASE_LABELS.de

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
          <button className="clear-btn" onClick={() => { setQuery(''); setResults([]); setExpanded(null) }}>✕</button>
        )}
      </div>

      {query.trim().length === 1 && (
        <div className="no-result">{t.typeMore || 'Mindestens 2 Buchstaben eingeben...'}</div>
      )}
      {loading && <div className="no-result">...</div>}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="no-result">{t.noResult}</div>
      )}

      {results.map(w => {
        const isOpen = expanded === w.word
        const det    = details[w.word]

        return (
          <div
            key={w.id}
            className="result-card"
            style={{ cursor: 'pointer' }}
            onClick={() => handleCardClick(w)}
          >
            {/* Заголовок карточки */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className={`article-badge badge-${w.article}`}>{w.article}</span>
                <span className="word-main" style={{ marginLeft: 8 }}>{w.word}</span>
              </div>
              <span style={{ opacity: 0.4, fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {w.plural && (
              <div className="word-sub" style={{ opacity: 0.6 }}>Pl: {w.plural}</div>
            )}

            {/* Раскрытая часть */}
            {isOpen && (
              <div>
                {det?.status === 'loading' && (
                  <div className="word-sub" style={{ marginTop: 12, opacity: 0.5 }}>
                    ⏳ {lang === 'ru' ? 'Загрузка...' : lang === 'en' ? 'Loading...' : 'Lädt...'}
                  </div>
                )}

                {det?.status === 'error' && (
                  <div className="word-sub" style={{ marginTop: 12, opacity: 0.5 }}>
                    {lang === 'ru' ? 'Ошибка загрузки' : 'Fehler beim Laden'}
                  </div>
                )}

                {det?.status === 'done' && (
                  <>
                    {det.data.description && (
                      <div className="word-sub" style={{ marginTop: 8 }}>
                        {det.data.description}
                      </div>
                    )}
                    {det.data.decl && (
                      <>
                        <div className="decl-divider" />
                        <div className="decl-label">{t.declension}</div>
                        <div className="decl-grid">
                          {caseKeys.map(key => (
                            <div key={key} className="decl-cell">
                              <div className="decl-case">{caseLabels[key]}</div>
                              <div className="decl-form">{det.data.decl[key]?.form}</div>
                              {det.data.decl[key]?.example && (
                                <div className="decl-example">{det.data.decl[key].example}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
