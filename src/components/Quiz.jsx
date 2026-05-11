import { useState, useEffect, useCallback } from 'react'
import words, { CATEGORIES } from '../data/words'
import { getRuleForWord } from '../data/rules'

const ALL_QUIZ_SIZE = 20
const CASES = ['N', 'G', 'D', 'A']

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Words eligible for declension quiz: must have both decl AND examples
const declWords = words.filter(w =>
  w.decl && w.examples &&
  CASES.every(c => w.decl[c] && w.examples[c])
)

// Build declension question for a word:
// - pick random case that has an example sentence
// - replace the declined form in the sentence with ___
// - options = unique declined forms of this word
function buildDeclItem(word) {
  const availableCases = CASES.filter(c => word.decl[c] && word.examples[c])
  const caseKey = availableCases[Math.floor(Math.random() * availableCases.length)]
  const correct  = word.decl[caseKey]
  const escaped  = correct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const sentence = word.examples[caseKey].replace(new RegExp(escaped, 'i'), '___')
  // Unique forms only (e.g. das/das Haus collapse to one)
  const options  = shuffle([...new Set(Object.values(word.decl))])
  return { word, type: 'decl', caseKey, correct, sentence, options }
}

// Build all quiz items upfront
function buildQuizItems(wordList, quizMode) {
  return wordList.map(word => {
    const canDecl = declWords.some(w => w.word === word.word)
    const useDecl =
      (quizMode === 'deklination' && canDecl) ||
      (quizMode === 'beide' && canDecl && Math.random() < 0.5)

    if (useDecl) return buildDeclItem(word)
    return { word, type: 'artikel' }
  })
}

export default function Quiz({ t, lang, onAnswer }) {
  const [quizMode, setQuizMode]    = useState('artikel')
  const [mode, setMode]            = useState('all')
  const [selectedCategory, setCat] = useState('all')
  const [quizItems, setQuizItems]  = useState([])
  const [index, setIndex]          = useState(0)
  const [chosen, setChosen]        = useState(null)
  const [done, setDone]            = useState(false)
  const [results, setResults]      = useState([])

  const getDescription = useCallback((w) => {
    if (lang === 'ru') return w.ru
    if (lang === 'en') return w.en
    return w.de
  }, [lang])

  const startQuiz = useCallback((category, wordList = null) => {
    let pool = wordList || (category === 'all' ? words : words.filter(w => w.category === category))

    // In pure deklination mode, only use words that have examples
    if (quizMode === 'deklination') pool = pool.filter(w => declWords.some(d => d.word === w.word))

    let selected = shuffle(pool)
    if (category === 'all' && !wordList) selected = selected.slice(0, ALL_QUIZ_SIZE)

    setQuizItems(buildQuizItems(selected, quizMode))
    setIndex(0)
    setChosen(null)
    setDone(false)
    setResults([])
    setCat(category)
  }, [quizMode])

  useEffect(() => { startQuiz('all') }, [startQuiz])
  useEffect(() => { startQuiz(selectedCategory) }, [quizMode]) // eslint-disable-line

  const handleModeChange    = (m) => setQuizMode(m)
  const handleCategoryClick = (catId) => { setMode('category'); startQuiz(catId) }
  const handleBack          = () => { setMode('all'); startQuiz('all') }

  const handleAnswer = (answer) => {
    if (chosen) return
    const item = quizItems[index]
    const isCorrect = item.type === 'decl'
      ? answer === item.correct
      : answer === item.word.article
    setChosen(answer)
    setResults(r => [...r, isCorrect])
    onAnswer(isCorrect, item.word.word)
  }

  const handleNext = () => {
    if (index + 1 >= quizItems.length) setDone(true)
    else { setIndex(i => i + 1); setChosen(null) }
  }

  const handleRepeatMistakes = () => {
    const wrong = quizItems.filter((_, i) => results[i] === false).map(it => it.word)
    if (wrong.length > 0) startQuiz(selectedCategory, wrong)
  }

  const modeLabels = {
    de: { artikel: 'Artikel', deklination: 'Deklination', beide: 'Beides' },
    ru: { artikel: 'Артикль', deklination: 'Склонение',   beide: 'Всё'   },
    en: { artikel: 'Article', deklination: 'Declension',  beide: 'Both'  },
  }
  const ml = modeLabels[lang] || modeLabels.de

  const cat      = CATEGORIES.find(c => c.id === selectedCategory)
  const quizSize = quizItems.length
  const item     = quizItems[index]

  // ── DONE SCREEN ─────────────────────────────────────────────
  if (done) {
    const correct    = results.filter(Boolean).length
    const wrongCount = quizSize - correct
    return (
      <div>
        <div className="quiz-done">
          <div className="quiz-done-icon">{correct === quizSize ? '🎉' : correct >= quizSize / 2 ? '👍' : '📚'}</div>
          <div className="quiz-done-title">{t.quizDone}</div>
          <div className="quiz-done-sub">{t.quizResult(correct, quizSize)}</div>
          <div className="quiz-done-segments">
            {results.map((r, i) => <div key={i} className={`progress-seg ${r ? 'seg-correct' : 'seg-wrong'}`} />)}
          </div>
          <div className="quiz-done-actions">
            <button className="next-btn" onClick={() => startQuiz(selectedCategory)}>{t.restart}</button>
            {wrongCount > 0 && (
              <button className="repeat-btn" onClick={handleRepeatMistakes}>
                🔁 {lang === 'ru' ? 'Повторить ошибки' : 'Fehler wiederholen'} ({wrongCount})
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
                  <button key={cat.id} className="category-card" onClick={() => handleCategoryClick(cat.id)}>
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

  if (!item) return null

  const isDecl    = item.type === 'decl'
  const isCorrect = isDecl
    ? chosen === item.correct
    : chosen === item.word.article

  const rule        = (!isCorrect && chosen && !isDecl) ? getRuleForWord(item.word.word, lang) : null
  const hint        = (!isCorrect && chosen && item.word.hint) ? item.word.hint[lang] : null
  const explanation = rule || (hint ? { rule: hint, exceptions: [] } : null)

  // ── QUIZ SCREEN ─────────────────────────────────────────────
  return (
    <div>
      {/* Mode selector */}
      <div className="quiz-mode-selector">
        {['artikel', 'deklination'].map(m => (
          <button key={m} className={`quiz-mode-btn${quizMode === m ? ' active' : ''}`} onClick={() => handleModeChange(m)}>
            {ml[m]}
          </button>
        ))}
      </div>

      {/* Category header */}
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

      {/* Progress bar */}
      <div className="quiz-meta">
        <div className="progress-segments">
          {quizItems.map((_, i) => {
            let cls = 'progress-seg'
            if (i < results.length) cls += results[i] ? ' seg-correct' : ' seg-wrong'
            else if (i === index)   cls += ' seg-current'
            return <div key={i} className={cls} />
          })}
        </div>
        <span className="quiz-count">{results.length} / {quizSize}</span>
      </div>

      {/* ── Artikel card ── */}
      {!isDecl && (
        <div className="quiz-card">
          <div className="quiz-word">{item.word.word}</div>
          <div className="quiz-trans">{getDescription(item.word)}</div>
        </div>
      )}

      {/* ── Deklination card ── */}
      {isDecl && (
        <div className="quiz-card quiz-card--decl">
          <div className="quiz-word quiz-word--sm">{item.word.word}</div>
          <div className="quiz-sentence">{item.sentence}</div>
        </div>
      )}

      {/* Artikel buttons */}
      {!isDecl && (
        <div className="article-btns">
          {['der', 'die', 'das'].map(article => {
            let cls = 'art-btn'
            if (chosen) {
              if (article === item.word.article) cls += ' correct'
              else if (article === chosen)        cls += ' wrong'
              else                                cls += ' dimmed'
            }
            return (
              <button key={article} className={cls} onClick={() => handleAnswer(article)} disabled={!!chosen}>
                {article}
              </button>
            )
          })}
        </div>
      )}

      {/* Deklination buttons */}
      {isDecl && (
        <div className="decl-btns">
          {item.options.map(option => {
            let cls = 'decl-btn'
            if (chosen) {
              if (option === item.correct) cls += ' correct'
              else if (option === chosen)  cls += ' wrong'
              else                         cls += ' dimmed'
            }
            return (
              <button key={option} className={cls} onClick={() => handleAnswer(option)} disabled={!!chosen}>
                {option}
              </button>
            )
          })}
        </div>
      )}

      {/* Feedback */}
      {chosen && (
        <div className={`feedback ${isCorrect ? 'feedback-ok' : 'feedback-err'}`}>
          {isCorrect
            ? t.correct
            : isDecl
              ? (lang === 'ru' ? `Нет — правильно: ${item.correct}` : `Falsch — richtig: ${item.correct}`)
              : t.wrong(`${item.word.article} ${item.word.word}`)
          }
        </div>
      )}

      {/* Grammar hint for wrong artikel answer */}
      {chosen && !isCorrect && !isDecl && explanation && (
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

      {/* Categories — only in all mode, before answering */}
      {mode === 'all' && !chosen && (
        <div className="category-section">
          <div className="category-label">{t.categories}</div>
          <div className="category-grid">
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
              const count = words.filter(w => w.category === cat.id).length
              return (
                <button key={cat.id} className="category-card" onClick={() => handleCategoryClick(cat.id)}>
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
