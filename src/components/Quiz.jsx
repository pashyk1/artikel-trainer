import { useState, useEffect, useCallback } from 'react'
import words, { CATEGORIES } from '../data/words'
import { getRuleForWord } from '../data/rules'

const ALL_QUIZ_SIZE = 20

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function Quiz({ t, lang, onAnswer }) {
  const [mode, setMode]           = useState('all')   // 'all' | 'category'
  const [selectedCategory, setCat] = useState('all')
  const [quizWords, setQuizWords] = useState([])
  const [index, setIndex]         = useState(0)
  const [chosen, setChosen]       = useState(null)
  const [done, setDone]           = useState(false)
  const [results, setResults]     = useState([])

  const getDescription = useCallback((w) => {
    if (!w) return ''
    if (lang === 'ru') return w.ru
    if (lang === 'en') return w.en
    return w.de
  }, [lang])

  const startQuiz = useCallback((category, wordList = null) => {
    let selected
    if (wordList) {
      selected = shuffle(wordList)
    } else if (category === 'all') {
      selected = shuffle(words).slice(0, ALL_QUIZ_SIZE)
    } else {
      selected = shuffle(words.filter(w => w.category === category))
    }
    setQuizWords(selected)
    setIndex(0)
    setChosen(null)
    setDone(false)
    setResults([])
    setCat(category)
  }, [])

  // Start with all words on mount
  useEffect(() => { startQuiz('all') }, [startQuiz])

  const handleCategoryClick = (catId) => {
    setMode('category')
    startQuiz(catId)
  }

  const handleBack = () => {
    setMode('all')
    startQuiz('all')
  }

  const handleAnswer = (article) => {
    if (chosen) return
    const current = quizWords[index]
    const isCorrect = article === current.article
    setChosen(article)
    setResults(r => [...r, isCorrect])
    onAnswer(isCorrect, current.word)
  }

  const handleNext = () => {
    if (index + 1 >= quizWords.length) setDone(true)
    else { setIndex(i => i + 1); setChosen(null) }
  }

  const handleRepeatMistakes = () => {
    const wrong = quizWords.filter((_, i) => results[i] === false)
    if (wrong.length > 0) startQuiz(selectedCategory, wrong)
  }

  const cat      = CATEGORIES.find(c => c.id === selectedCategory)
  const quizSize = quizWords.length
  const current  = quizWords[index]

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

  const isCorrect   = chosen === current.article
  const rule        = (!isCorrect && chosen) ? getRuleForWord(current.word, lang) : null
  const hint        = (!isCorrect && chosen && current.hint) ? current.hint[lang] : null
  const explanation = rule || (hint ? { rule: hint, exceptions: [] } : null)

  return (
    <div>
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
      </div>

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

      {chosen && (
        <div className={`feedback ${isCorrect ? 'feedback-ok' : 'feedback-err'}`}>
          {isCorrect ? t.correct : t.wrong(`${current.article} ${current.word}`)}
        </div>
      )}

      {chosen && !isCorrect && explanation && (
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
