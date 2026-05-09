import { useState, useEffect, useCallback } from 'react'
import words, { CATEGORIES } from '../data/words'
import { getRuleForWord } from '../data/rules'

const QUIZ_SIZE = 10

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function Quiz({ t, lang, onAnswer }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [quizWords, setQuizWords] = useState([])
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [done, setDone] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)

  const getDescription = useCallback((w) => {
    if (!w) return ''
    if (lang === 'ru') return w.ru
    if (lang === 'en') return w.en
    return w.de
  }, [lang])

  const startQuiz = useCallback((category) => {
    const filtered = category === 'all' 
      ? words 
      : words.filter(w => w.category === category)
    
    const selected = shuffle(filtered).slice(0, QUIZ_SIZE)
    setQuizWords(selected)
    setIndex(0)
    setChosen(null)
    setDone(false)
    setSessionCorrect(0)
    setSelectedCategory(category)
  }, [])

  useEffect(() => { startQuiz('all') }, [startQuiz])

  const current = quizWords[index]

  const handleAnswer = (article) => {
    if (chosen) return
    setChosen(article)
    const isCorrect = article === current.article
    if (isCorrect) setSessionCorrect(c => c + 1)
    onAnswer(isCorrect, current.word)
  }

  const handleNext = () => {
    if (index + 1 >= QUIZ_SIZE) { setDone(true) }
    else { setIndex(i => i + 1); setChosen(null) }
  }

  const handleCategoryClick = (catId) => {
    startQuiz(catId)
  }

  if (!current && !done) return null

  if (done) {
    return (
      <div>
        <div className="quiz-done">
          <div className="quiz-done-icon">🎉</div>
          <div className="quiz-done-title">{t.quizDone}</div>
          <div className="quiz-done-sub">{t.quizResult(sessionCorrect, QUIZ_SIZE)}</div>
          <button className="next-btn" onClick={() => startQuiz(selectedCategory)}>{t.restart}</button>
        </div>

        <div className="category-section">
          <div className="category-label">{t.categories}</div>
          <div className="category-scroll">
            {CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? words.length : words.filter(w => w.category === cat.id).length
              return (
                <button
                  key={cat.id}
                  className={`category-card${selectedCategory === cat.id ? ' active' : ''}`}
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
      </div>
    )
  }

  const isCorrect = chosen === current?.article
  const rule = (!isCorrect && chosen) ? getRuleForWord(current.word, lang) : null
  const hint = (!isCorrect && chosen && current.hint) ? current.hint[lang] : null
  const explanation = rule || (hint ? { rule: hint, exceptions: [] } : null)

  return (
    <div>
      <div className="quiz-meta">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.round((index / QUIZ_SIZE) * 100)}%` }} />
        </div>
        <span className="quiz-count">{index} / {QUIZ_SIZE}</span>
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
          {index + 1 >= QUIZ_SIZE ? t.quizDone : t.nextWord}
        </button>
      )}

      {!chosen && (
        <div className="category-section">
          <div className="category-label">{t.categories}</div>
          <div className="category-scroll">
            {CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? words.length : words.filter(w => w.category === cat.id).length
              return (
                <button
                  key={cat.id}
                  className={`category-card${selectedCategory === cat.id ? ' active' : ''}`}
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
