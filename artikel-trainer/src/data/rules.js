const articleRules = [
  {
    test: (w) => /ung$/i.test(w),
    article: 'die',
    de: { rule: 'Wörter auf -ung sind fast immer feminin.', exceptions: ['der Dung', 'der Schwung', 'der Sprung', 'der Ursprung'] },
    ru: { rule: 'Слова на -ung почти всегда женского рода.', exceptions: ['der Dung', 'der Schwung', 'der Sprung', 'der Ursprung'] },
    en: { rule: 'Words ending in -ung are almost always feminine.', exceptions: ['der Dung', 'der Schwung', 'der Sprung', 'der Ursprung'] },
  },
  {
    test: (w) => /heit$|keit$/i.test(w),
    article: 'die',
    de: { rule: 'Wörter auf -heit und -keit sind immer feminin — keine Ausnahmen.', exceptions: [] },
    ru: { rule: 'Слова на -heit и -keit всегда женского рода — исключений нет.', exceptions: [] },
    en: { rule: 'Words ending in -heit or -keit are always feminine — no exceptions.', exceptions: [] },
  },
  {
    test: (w) => /schaft$/i.test(w),
    article: 'die',
    de: { rule: 'Wörter auf -schaft sind immer feminin — keine Ausnahmen.', exceptions: [] },
    ru: { rule: 'Слова на -schaft всегда женского рода — исключений нет.', exceptions: [] },
    en: { rule: 'Words ending in -schaft are always feminine — no exceptions.', exceptions: [] },
  },
  {
    test: (w) => /tion$|sion$|ation$/i.test(w),
    article: 'die',
    de: { rule: 'Wörter auf -tion / -sion / -ation sind immer feminin.', exceptions: [] },
    ru: { rule: 'Слова на -tion / -sion / -ation всегда женского рода.', exceptions: [] },
    en: { rule: 'Words ending in -tion / -sion / -ation are always feminine.', exceptions: [] },
  },
  {
    test: (w) => /chen$|lein$/i.test(w),
    article: 'das',
    de: { rule: 'Verkleinerungen auf -chen / -lein sind immer sächlich — egal welches Geschlecht das Grundwort hat.', exceptions: [] },
    ru: { rule: 'Уменьшительные на -chen / -lein всегда среднего рода — независимо от рода исходного слова.', exceptions: [] },
    en: { rule: 'Diminutives ending in -chen / -lein are always neuter — regardless of the base word gender.', exceptions: [] },
  },
  {
    test: (w) => /ment$/i.test(w),
    article: 'das',
    de: { rule: 'Wörter auf -ment sind meist sächlich.', exceptions: ['der Zement', 'der Komment'] },
    ru: { rule: 'Слова на -ment чаще всего среднего рода.', exceptions: ['der Zement', 'der Komment'] },
    en: { rule: 'Words ending in -ment are mostly neuter.', exceptions: ['der Zement', 'der Komment'] },
  },
  {
    test: (w) => /tum$/i.test(w),
    article: 'das',
    de: { rule: 'Wörter auf -tum sind meist sächlich.', exceptions: ['der Irrtum', 'der Reichtum'] },
    ru: { rule: 'Слова на -tum чаще всего среднего рода.', exceptions: ['der Irrtum', 'der Reichtum'] },
    en: { rule: 'Words ending in -tum are mostly neuter.', exceptions: ['der Irrtum', 'der Reichtum'] },
  },
  {
    test: (w) => /er$/i.test(w),
    article: 'der',
    de: { rule: 'Wörter auf -er (besonders Berufe) sind oft maskulin.', exceptions: ['das Messer', 'das Wasser', 'das Fenster', 'das Zimmer', 'das Wetter', 'die Mutter', 'die Butter', 'die Schulter'] },
    ru: { rule: 'Слова на -er (особенно профессии) часто мужского рода.', exceptions: ['das Messer', 'das Wasser', 'das Fenster', 'das Zimmer', 'das Wetter', 'die Mutter', 'die Butter', 'die Schulter'] },
    en: { rule: 'Words ending in -er (especially professions) are often masculine.', exceptions: ['das Messer', 'das Wasser', 'das Fenster', 'das Zimmer', 'das Wetter', 'die Mutter', 'die Butter', 'die Schulter'] },
  },
  {
    test: (w) => /ig$/i.test(w),
    article: 'der',
    de: { rule: 'Wörter auf -ig sind meist maskulin.', exceptions: ['das Reisig', 'das Königreich'] },
    ru: { rule: 'Слова на -ig чаще всего мужского рода.', exceptions: ['das Reisig'] },
    en: { rule: 'Words ending in -ig are mostly masculine.', exceptions: ['das Reisig'] },
  },
]

export function getRuleForWord(word, lang) {
  const rule = articleRules.find(r => r.test(word))
  if (!rule) return null
  return { article: rule.article, ...rule[lang] }
}
