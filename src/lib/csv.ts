import { clock, hm, parseISO } from './dates.ts'

export interface CsvEntry {
  work_date: string
  entry_at: string | null
  exit_at: string | null
  worked_minutes: number | null
  lunch_minutes: number | null
  paid_minutes: number | null
  night_minutes: number | null
  note: string | null
}

/** Quote a field; neutralise spreadsheet formulas (=, +, -, @) typed into notes. */
export const csvField = (value: string): string => {
  let v = value
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`
  return `"${v.replace(/"/g, '""')}"`
}

const HEADER = ['Date', 'Day', 'Entry time', 'Exit time', 'Hours worked', 'Lunch break (min)', 'Paid hours', 'Night hours', 'Notes']

/**
 * Builds a CSV that opens cleanly in Excel: UTF-8 BOM, CRLF line endings, a "sep=," line so it
 * splits into columns in any Excel language, oldest day first. Hours are written as h:mm.
 */
export const buildCsv = (entries: CsvEntry[]): string => {
  const rows = [...entries].sort((a, b) => a.work_date.localeCompare(b.work_date))
  const lines = ['sep=,', HEADER.map(csvField).join(',')]
  for (const e of rows) {
    const day = parseISO(e.work_date).toLocaleDateString('en-US', { weekday: 'long' })
    lines.push(
      [
        e.work_date,
        day,
        clock(e.entry_at),
        clock(e.exit_at),
        hm(e.worked_minutes),
        e.lunch_minutes == null ? '' : String(e.lunch_minutes),
        hm(e.paid_minutes),
        hm(e.night_minutes),
        e.note ?? '',
      ]
        .map(csvField)
        .join(','),
    )
  }
  return '﻿' + lines.join('\r\n') + '\r\n'
}

export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
