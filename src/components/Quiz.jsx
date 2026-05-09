import { useState, useEffect, useCallback } from 'react'
import words, { CATEGORIES } from '../data/words'
import { getRuleForWord } from '../data/rules'

const MAX_ALL_WORDS = 20

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function Quiz({ t, lang, onAnswer }) {
  const [selectedCategory, setSelectedCategory] = useState(null) // null значит экран выбора
  const [quizWords, setQuizWords] = useState([])
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [done, setDone] = useState(false)
  const [history, setHistory] = useState([]) // Храним результаты: true/false для каждого вопроса
  const [wrongWords, setWrongWords] = useState([])

  const startQuiz = useCallback((category, wordsToUse = null) => {
    let baseWords = wordsToUse 
      ? wordsToUse 
      : (category === 'all' ? words : words.filter(w => w.category === category))
    
    // Ограничение для режима "Все слова", если это не повтор ошибок
    let selected = shuffle(baseWords)
    if (category === 'all' && !wordsToUse) {
      selected = selected.slice(0, MAX_ALL_WORDS)
    }

    setQuizWords(selected)
    setIndex(0)
    setChosen(null)
    setDone(false)
    setHistory([])
    setWrongWords([])
    setSelectedCategory(category)
  }, [])

  const current = quizWords[index]

  const handleAnswer = (article) => {
    if (chosen) return
    const isCorrect = article === current.article
    setChosen(article)
    setHistory([...history, isCorrect])
    
    if (!isCorrect) {
      setWrongWords(prev => [...prev, current])
    }
    
    onAnswer(isCorrect, current.word)
  }

  const handleNext = () => {
    if (index + 1 < quizWords.length) {
      setIndex(index + 1)
      setChosen(null)
    } else {
      setDone(true)
    }
  }

  const retryErrors = () => {
    startQuiz(selectedCategory, wrongWords)
  }

  // Экран выбора категорий
  if (!selectedCategory) {
    return (
      <div className="category-section">
        <div className="category-label">{t.categories}</div>
        <div className="category-grid">
          {CATEGORIES.map(cat => {
            const count = cat.id === 'all' ? words.length : words.filter(w => w.category === cat.id).length
            return (
              <button key={cat.id} className="category-card" onClick={() => startQuiz(cat.id)}>
                <div className="category-emoji">{cat.emoji}</div>
                <div className="category-name">{cat[lang]}</div>
                <div className="category-count">{count} {t.words}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Экран результата
  if (done) {
    const correctCount = history.filter(h => h).length
    return (
      <div className="quiz-done">
        <h2>{t.quizDone}</h2>
        <div className="score">{correctCount} / {quizWords.length}</div>
        <div className="done-actions">
          <button className="next-btn" onClick={() => setSelectedCategory(null)}>{t.toCategories || 'К категориям'}</button>
          {wrongWords.length > 0 && (
            <button className="cta-btn" onClick={retryErrors} style={{marginTop: '10px'}}>
              Повторить ошибки ({wrongWords.length})
            </button>
          )}
        </div>
      </div>
    )
  }

  const explanation = getRuleForWord(current.word)

  return (
    <div className="quiz-container">
      {/* Шапка квиза */}
      <div className="quiz-header">
        <button className="back-link" onClick={() => setSelectedCategory(null)}>
          ← {t.categories}
        </button>
        <div className="active-cat-name">
          {CATEGORIES.find(c => c.id === selectedCategory)?.[lang]} • {quizWords.length}
        </div>
      </div>

      {/* Сегментированный прогресс-бар */}
      <div className="segmented-progress">
        {quizWords.map((_, i) => {
          let status = 'pending'
          if (i < history.length) status = history[i] ? 'correct' : 'wrong'
          return <div key={i} className={`progress-segment ${status}`} />
        })}
      </div>

      <div className="quiz-card">
        <div className="word-to-guess">{current.word}</div>
        <div className="word-translation">
          {lang === 'ru' ? current.ru : current.en}
        </div>
      </div>

      <div className="article-buttons">
        {['der', 'die', 'das'].map(art => (
          <button
            key={art}
            className={`art-btn ${art} ${chosen === art ? 'chosen' : ''} ${chosen && current.article === art ? 'correct' : ''}`}
            onClick={() => handleAnswer(art)}
            disabled={!!chosen}
          >
            {art}
          </button>
        ))}
      </div>

      {chosen && (
        <div className="explanation-box">
          <div className="explanation-rule">
            <strong>{t.ruleLabel}: </strong> {explanation[lang]?.rule || explanation.de.rule}
          </div>
          {current.examples?.N && (
            <div className="word-example" style={{marginTop: '10px', fontStyle: 'italic', color: 'var(--text2)'}}>
              {current.examples.N}
            </div>
          )}
          <button className="next-btn" onClick={handleNext} style={{marginTop: '20px'}}>
            {index + 1 >= quizWords.length ? t.quizDone : t.nextWord}
          </button>
        </div>
      )}
    </div>
  )
}