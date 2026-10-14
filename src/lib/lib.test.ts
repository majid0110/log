import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCsv, csvField } from './csv.ts'
import { monthGrid, shiftMonth, toISO, parseISO, monthKey } from './dates.ts'

test('csvField quotes and escapes', () => {
  assert.equal(csvField('a "b", c'), '"a ""b"", c"')
})

test('csvField neutralises formulas', () => {
  assert.equal(csvField('=1+1'), `"'=1+1"`)
  assert.equal(csvField('@SUM(A1)'), `"'@SUM(A1)"`)
})

test('buildCsv has BOM, header, CRLF and sorted rows', () => {
  const csv = buildCsv([
    { work_date: '2026-10-14', recorded_at: '2026-10-14T06:30:00Z', note: 'Face scanner showed absent' },
    { work_date: '2026-10-13', recorded_at: '2026-10-13T06:30:00Z', note: null },
  ])
  assert.ok(csv.startsWith('﻿"Date","Day","Time recorded","Notes"\r\n'))
  const lines = csv.trim().split('\r\n')
  assert.equal(lines.length, 3)
  assert.ok(lines[1].startsWith('"2026-10-13","Tuesday"'))
  assert.ok(lines[2].startsWith('"2026-10-14","Wednesday"'))
  assert.ok(lines[2].endsWith('"Face scanner showed absent"'))
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
})
