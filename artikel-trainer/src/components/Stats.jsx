export default function Stats({ t, stats }) {
  const { correct, total, streak, known } = stats
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : null

  return (
    <div>
      <div className="register-cta">
        <div className="cta-icon">📈</div>
        <div className="cta-title">{t.ctaTitle}</div>
        <div className="cta-sub">{t.ctaSub}</div>
        <button className="cta-btn">{t.ctaRegister}</button>
        <span className="cta-login">
          {t.ctaHaveAccount} <span>{t.ctaLogin}</span>
        </span>
      </div>

      <div className="stats-preview">
        <div className="stat-card"><div className="stat-label">{t.statCorrect}</div><div className="stat-value">{correct}</div></div>
        <div className="stat-card"><div className="stat-label">{t.statAcc}</div><div className="stat-value">{accuracy !== null ? `${accuracy}%` : '—'}</div></div>
        <div className="stat-card"><div className="stat-label">{t.statStreak}</div><div className="stat-value">{streak}</div></div>
        <div className="stat-card"><div className="stat-label">{t.statTotal}</div><div className="stat-value">{total}</div></div>
      </div>
    </div>
  )
}
