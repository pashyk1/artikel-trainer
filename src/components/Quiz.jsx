import { useState, useEffect, useCallback } from 'react'
import words, { CATEGORIES } from '../data/words'
import { getRuleForWord } from '../data/rules'

const ALL_QUIZ_SIZE = 20
const CASES = ['N', 'G', 'D', 'A']

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Generate 3 wrong declension options for a given word + case
function getWrongDeclOptions(current, caseKey) {
  const correct = current.decl[caseKey]
  const pool = words
    .filter(w => w.word !== current.word && w.decl && w.decl[caseKey] !== correct)
    .map(w => w.decl[caseKey])
  // Deduplicate
  const unique = [...new Set(pool)]
  return shuffle(unique).slice(0, 3)
}

export default function Quiz({ t, lang, onAnswer }) {
  const [quizMode, setQuizMode]   = useState('artikel')  // 'artikel' | 'deklination' | 'beide'
  const [mode, setMode]           = useState('all')       // 'all' | 'category'
  const [selectedCategory, setCat] = useState('all')
  const [quizWords, setQuizWords] = useState([])
  const [index, setIndex]         = useState(0)
  const [chosen, setChosen]       = useState(null)
  const [done, setDone]           = useState(false)
  const [results, setResults]     = useState([])

  // For deklination mode: which case is being asked
  const [currentCase, setCurrentCase] = useState('N')
  const [declOptions, setDeclOptions] = useState([])

  const getDescription = useCallback((w) => {
    if (!w) return ''
    if (lang === 'ru') return w.ru
    if (lang === 'en') return w.en
    return w.de
  }, [lang])

  // Pick a random case and build answer options for a word
  const buildDeclQuestion = useCallback((word) => {
    const caseKey = CASES[Math.floor(Math.random() * CASES.length)]
    const correct = word.decl[caseKey]
    const wrong   = getWrongDeclOptions(word, caseKey)
    const options = shuffle([correct, ...wrong])
    setCurrentCase(caseKey)
    setDeclOptions(options)
  }, [])

  const startQuiz = useCallback((category, wordList = null) => {
    // Only use words that have decl data when needed
    let pool = wordList || (
      category === 'all'
        ? words
        : words.filter(w => w.category === category)
    )

    if (quizMode === 'deklination' || quizMode === 'beide') {
      pool = pool.filter(w => w.decl)
    }

    let selected = shuffle(pool)
    if (category === 'all' && !wordList) selected = selected.slice(0, ALL_QUIZ_SIZE)

    setQuizWords(selected)
    setIndex(0)
    setChosen(null)
    setDone(false)
    setResults([])
    setCat(category)
  }, [quizMode])

  useEffect(() => { startQuiz('all') }, [startQuiz])

  // When index changes in deklination/beide mode, build new question
  useEffect(() => {
    const current = quizWords[index]
    if (!current) return
    const needDecl = quizMode === 'deklination' ||
      (quizMode === 'beide' && Math.random() < 0.5)
    if (needDecl && current.decl) {
      buildDeclQuestion(current)
      setCurrentCase(prev => prev) // will be set in buildDeclQuestion
    }
  }, [index, quizWords, quizMode, buildDeclQuestion])

  const handleCategoryClick = (catId) => {
    setMode('category')
    startQuiz(catId)
  }

  const handleBack = () => {
    setMode('all')
    startQuiz('all')
  }

  // Determine if current question is a declension question
  const isDeclQuestion = () => {
    const current = quizWords[index]
    if (!current?.decl) return false
    if (quizMode === 'deklination') return true
    if (quizMode === 'beide') return declOptions.length > 0
    return false
  }

  const handleAnswer = (answer) => {
    if (chosen) return
    const current = quizWords[index]
    let isCorrect

    if (isDeclQuestion()) {
      isCorrect = answer === current.decl[currentCase]
    } else {
      isCorrect = answer === current.article
    }

    setChosen(answer)
    setResults(r => [...r, isCorrect])
    onAnswer(isCorrect, current.word)
  }

  // Reset declOptions when switching to artikel mode
  const handleModeChange = (newMode) => {
    setQuizMode(newMode)
    if (newMode === 'artikel') setDeclOptions([])
  }

  const handleNext = () => {
    setDeclOptions([])
    if (index + 1 >= quizWords.length) setDone(true)
    else {
      setIndex(i => i + 1)
      setChosen(null)
    }
  }

  const handleRepeatMistakes = () => {
    const wrong = quizWords.filter((_, i) => results[i] === false)
    if (wrong.length > 0) startQuiz(selectedCategory, wrong)
  }

  const cat      = CATEGORIES.find(c => c.id === selectedCategory)
  const quizSize = quizWords.length
  const current  = quizWords[index]

  const caseLabels = {
    de: { N: 'Nominativ', G: 'Genitiv', D: 'Dativ', A: 'Akkusativ' },
    ru: { N: 'Именит.',   G: 'Родит.',  D: 'Дат.',  A: 'Винит.'  },
    en: { N: 'Nominative',G: 'Genitive',D: 'Dative', A: 'Accusative' },
  }

  const modeLabels = {
    de: { artikel: 'Artikel', deklination: 'Deklination', beide: 'Beides' },
    ru: { artikel: 'Артикль', deklination: 'Склонение',   beide: 'Всё'   },
    en: { artikel: 'Article', deklination: 'Declension',  beide: 'Both'  },
  }

  // ── DONE SCREEN ──────────────────────────────────────────────
  if (done) {
    const correct    = results.filter(Boolean).length
    const wrongCount = quizSize - correct

    return (
      <div>
        <div className="quiz-done">
          <div className="quiz-done-icon">
            {correct === quizSize ? '🎉' : correct >= quizSize / 2 ? '👍' : '📚'}
          </div>
          <div className="quiz-done-title">{t.quizDone}</div>
          <div className="quiz-done-sub">{t.quizResult(correct, quizSize)}</div>

          <div className="quiz-done-segments">
            {results.map((r, i) => (
              <div key={i} className={`progress-seg ${r ? 'seg-correct' : 'seg-wrong'}`} />
            ))}
          </div>

          <div className="quiz-done-actions">
            <button className="next-btn" onClick={() => startQuiz(selectedCategory)}>
              {t.restart}
            </button>
            {wrongCount > 0 && (
              <button className="repeat-btn" onClick={handleRepeatMistakes}>
                🔁 {t.repeatMistakes || (lang === 'ru' ? 'Повторить ошибки' : 'Fehler wiederholen')} ({wrongCount})
              </button>
            )}
          </div>

          {mode === 'category' && (
            <button className="quiz-back-link" onClick={handleBack}>
              ← {lang === 'ru' ? 'Все слова' : lang === 'en' ? 'All words' : 'Alle Wörter'}
            </button>
          )}
        </div>

        {mode === 'all' && (
          <div className="category-section">
            <div className="category-label">{t.categories}</div>
            <div className="category-grid">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                const count = words.filter(w => w.category === cat.id).length
                return (
                  <button
                    key={cat.id}
                    className="category-card"
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <div className="category-emoji">{cat.emoji}</div>
                    <div className="category-name">{cat[lang]}</div>
                    <div className="category-count">{count} {t.words}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── QUIZ SCREEN ──────────────────────────────────────────────
  if (!current) return null

  const isDecl      = isDeclQuestion()
  const isCorrect   = isDecl
    ? chosen === current.decl[currentCase]
    : chosen === current.article
  const rule        = (!isCorrect && chosen) ? getRuleForWord(current.word, lang) : null
  const hint        = (!isCorrect && chosen && current.hint) ? current.hint[lang] : null
  const explanation = rule || (hint ? { rule: hint, exceptions: [] } : null)

  const ml = modeLabels[lang] || modeLabels['de']

  return (
    <div>
      {/* ── Mode selector ── */}
      <div className="quiz-mode-selector">
        {['artikel', 'deklination', 'beide'].map(m => (
          <button
            key={m}
            className={`quiz-mode-btn${quizMode === m ? ' active' : ''}`}
            onClick={() => handleModeChange(m)}
          >
            {ml[m]}
          </button>
        ))}
      </div>

      {/* Header: back button (category mode) OR category name (all mode) */}
      {mode === 'category' ? (
        <div className="quiz-category-header">
          <button className="quiz-exit-btn" onClick={handleBack}>←</button>
          <div className="quiz-category-info">
            <span className="quiz-category-name">{cat?.emoji} {cat?.[lang]}</span>
            <span className="quiz-category-total">{quizSize} {t.words}</span>
          </div>
        </div>
      ) : (
        <div className="quiz-category-header quiz-category-header--all">
          <span className="quiz-category-name">🇩🇪 {lang === 'ru' ? 'Все слова' : lang === 'en' ? 'All words' : 'Alle Wörter'}</span>
          <span className="quiz-category-total">{quizSize} {t.words}</span>
        </div>
      )}

      {/* Segmented progress bar */}
      <div className="quiz-meta">
        <div className="progress-segments">
          {quizWords.map((_, i) => {
            let cls = 'progress-seg'
            if (i < results.length)  cls += results[i] ? ' seg-correct' : ' seg-wrong'
            else if (i === index)    cls += ' seg-current'
            return <div key={i} className={cls} />
          })}
        </div>
        <span className="quiz-count">{results.length} / {quizSize}</span>
      </div>

      <div className="quiz-card">
        <div className="quiz-word">{current.word}</div>
        <div className="quiz-trans">{getDescription(current)}</div>
        {/* Show which case is being asked in decl mode */}
        {isDecl && (
          <div className="quiz-case-badge">
            {(caseLabels[lang] || caseLabels['de'])[currentCase]}
          </div>
        )}
      </div>

      {/* ── ARTIKEL buttons (3) ── */}
      {!isDecl && (
        <div className="article-btns">
          {['der', 'die', 'das'].map(article => {
            let cls = 'art-btn'
            if (chosen) {
              if (article === current.article) cls += ' correct'
              else if (article === chosen)     cls += ' wrong'
              else                             cls += ' dimmed'
            }
            return (
              <button key={article} className={cls} onClick={() => handleAnswer(article)} disabled={!!chosen}>
                {article}
              </button>
            )
          })}
        </div>
      )}

      {/* ── DEKLINATION buttons (4 options) ── */}
      {isDecl && (
        <div className="decl-btns">
          {declOptions.map(option => {
            let cls = 'decl-btn'
            if (chosen) {
              if (option === current.decl[currentCase]) cls += ' correct'
              else if (option === chosen)               cls += ' wrong'
              else                                      cls += ' dimmed'
            }
            return (
              <button key={option} className={cls} onClick={() => handleAnswer(option)} disabled={!!chosen}>
                {option}
              </button>
            )
          })}
        </div>
      )}

      {chosen && (
        <div className={`feedback ${isCorrect ? 'feedback-ok' : 'feedback-err'}`}>
          {isCorrect
            ? t.correct
            : isDecl
              ? (lang === 'ru' ? `Нет — правильно: ${current.decl[currentCase]}` : `Falsch — richtig: ${current.decl[currentCase]}`)
              : t.wrong(`${current.article} ${current.word}`)
          }
        </div>
      )}

      {chosen && !isCorrect && explanation && !isDecl && (
        <div className="explanation-card">
          <div className="explanation-rule">
            <span className="explanation-label">{t.ruleLabel}: </span>
            {explanation.rule}
          </div>
          {explanation.exceptions?.length > 0 && (
            <div className="explanation-exceptions">
              <span className="explanation-label">{t.exceptionsLabel}: </span>
              {explanation.exceptions.join(' · ')}
            </div>
          )}
        </div>
      )}

      {chosen && (
        <button className="next-btn" onClick={handleNext}>
          {index + 1 >= quizSize ? (t.finish || 'Fertig 🎉') : t.nextWord}
        </button>
      )}

      {/* Categories grid — only in 'all' mode, only before answering */}
      {mode === 'all' && !chosen && (
        <div className="category-section">
          <div className="category-label">{t.categories}</div>
          <div className="category-grid">
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
              const count = words.filter(w => w.category === cat.id).length
              return (
                <button
                  key={cat.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <div className="category-emoji">{cat.emoji}</div>
                  <div className="category-name">{cat[lang]}</div>
                  <div className="category-count">{count} {t.words}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
