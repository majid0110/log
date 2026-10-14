import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCsv, csvField } from './csv.ts'
import {
  addDays, clock, currentPeriod, duration, hm, monthGrid, monthKey, parseISO, periodsOf, shiftMonth, toISO,
} from './dates.ts'

test('csvField quotes and escapes', () => {
  assert.equal(csvField('a "b", c'), '"a ""b"", c"')
})

test('csvField neutralises formulas', () => {
  assert.equal(csvField('=1+1'), `"'=1+1"`)
  assert.equal(csvField('@SUM(A1)'), `"'@SUM(A1)"`)
})

test('buildCsv: sep line, BOM, header, entry/exit columns, sorted rows', () => {
  const csv = buildCsv([
    {
      work_date: '2026-10-14', entry_at: '2026-10-14T08:02:11', exit_at: '2026-10-14T17:10:00',
      worked_minutes: 548, lunch_minutes: 45, paid_minutes: 503, night_minutes: 0, note: 'Face scanner showed absent',
    },
    {
      work_date: '2026-10-13', entry_at: null, exit_at: null,
      worked_minutes: null, lunch_minutes: null, paid_minutes: null, night_minutes: null, note: null,
    },
  ])
  assert.ok(csv.startsWith('﻿sep=,\r\n"Date","Day","Entry time","Exit time","Hours worked"'))
  const lines = csv.trim().split('\r\n')
  assert.equal(lines.length, 4)
  assert.equal(lines[2], '"2026-10-13","Tuesday","","","","","","",""')
  assert.equal(
    lines[3],
    '"2026-10-14","Wednesday","08:02","17:10","9:08","45","8:23","0:00","Face scanner showed absent"',
  )
})

test('monthGrid is Monday-first with correct length', () => {
  const grid = monthGrid('2026-10') // 1 Oct 2026 is a Thursday -> 3 leading blanks
  assert.equal(grid.filter((c) => c === null).length, 3)
  assert.equal(grid.length, 3 + 31)
  assert.equal(grid[3], '2026-10-01')
})

test('shiftMonth crosses year boundaries', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01')
  assert.equal(shiftMonth('2026-01', -1), '2025-12')
})

test('toISO / parseISO round trip uses local date', () => {
  assert.equal(toISO(parseISO('2026-03-09')), '2026-03-09')
  assert.equal(monthKey('2026-03-09'), '2026-03')
  assert.equal(addDays('2026-10-31', 1), '2026-11-01')
})

test('time formatting', () => {
  assert.equal(clock('2026-10-14T08:02:11'), '08:02')
  assert.equal(clock(null), '')
  assert.equal(duration(495), '8h 15m')
  assert.equal(duration(45), '45m')
  assert.equal(duration(null), '—')
  assert.equal(hm(503), '8:23')
})

test('pay periods: 1-15 and 16-end, including 28, 30 and 31 day months', () => {
  assert.deepEqual(periodsOf('2026-10')[1], { start: '2026-10-16', end: '2026-10-31', label: '16–31', second: true })
  assert.deepEqual(periodsOf('2026-11')[1], { start: '2026-11-16', end: '2026-11-30', label: '16–30', second: true })
  assert.equal(periodsOf('2026-02')[1].end, '2026-02-28')
  assert.equal(periodsOf('2028-02')[1].end, '2028-02-29')
  assert.equal(currentPeriod('2026-10-15').second, false)
  assert.equal(currentPeriod('2026-10-16').second, true)
})
