import test from 'node:test'
import assert from 'node:assert/strict'
import { DICTIONARIES, setLang, t, tp, type Key } from './i18n.ts'
import { buildCsv } from './csv.ts'
import { duration, monthTitle, weekdayName } from './dates.ts'

const placeholders = (s: string): string => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')

test('every Russian text has the same {placeholders} as the English one', () => {
  const { en, ru } = DICTIONARIES
  for (const key of Object.keys(en) as Key[]) {
    assert.ok(ru[key].trim().length > 0, `Russian text missing for ${key}`)
    assert.equal(placeholders(ru[key]), placeholders(en[key]), `placeholders differ for ${key}`)
  }
  assert.deepEqual(Object.keys(ru).sort(), Object.keys(en).sort())
})

test('English: texts, placeholders and plurals', () => {
  setLang('en')
  assert.equal(t('home.btnIn'), 'I Worked Today')
  assert.equal(t('home.subOut', { time: '08:00', dur: '1h 05m' }), 'In at 08:00 · working 1h 05m')
  assert.equal(tp('days', 1), '1 day')
  assert.equal(tp('days', 5), '5 days')
  assert.equal(duration(495), '8h 15m')
  assert.equal(weekdayName('2026-10-14'), 'Wednesday')
})

test('Russian: texts, plural forms (1 / 2-4 / 5-20 / 21 / 22 / 11)', () => {
  setLang('ru')
  assert.equal(t('home.btnIn'), 'Я отработал сегодня')
  assert.equal(tp('days', 1), '1 день')
  assert.equal(tp('days', 2), '2 дня')
  assert.equal(tp('days', 4), '4 дня')
  assert.equal(tp('days', 5), '5 дней')
  assert.equal(tp('days', 11), '11 дней')
  assert.equal(tp('days', 21), '21 день')
  assert.equal(tp('days', 22), '22 дня')
  assert.equal(tp('days', 0), '0 дней')
  assert.equal(tp('daysWorked', 3), '3 дня отработано')
  assert.match(tp('openDays', 2), /^2 дня /)
  assert.equal(duration(495), '8ч 15м')
  assert.equal(weekdayName('2026-10-14'), 'среда')
  assert.match(monthTitle('2026-10'), /октябрь/i)
  setLang('en')
})

test('CSV headers and day names follow the chosen language', () => {
  const row = {
    work_date: '2026-10-14', entry_at: '2026-10-14T08:00:00', exit_at: '2026-10-14T17:00:00',
    worked_minutes: 540, lunch_minutes: 45, paid_minutes: 495, night_minutes: 0, note: null,
  }
  setLang('ru')
  const ru = buildCsv([row]).split('\r\n')
  assert.equal(ru[1], '"Дата","День","Время входа","Время выхода","Отработано часов","Обед (мин)","Оплачиваемые часы","Ночные часы","Заметки"')
  assert.ok(ru[2].startsWith('"2026-10-14","среда","08:00","17:00"'))
  setLang('en')
  const en = buildCsv([row]).split('\r\n')
  assert.ok(en[1].startsWith('"Date","Day","Entry time"'))
  assert.ok(en[2].startsWith('"2026-10-14","Wednesday"'))
})
