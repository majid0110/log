import { parseISO, timeOf } from './dates.ts'

export interface CsvEntry {
  work_date: string
  recorded_at: string
  note: string | null
}

/** Quote a field; neutralise spreadsheet formulas (=, +, -, @) typed into notes. */
export const csvField = (value: string): string => {
  let v = value
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`
  return `"${v.replace(/"/g, '""')}"`
}

/**
 * Builds a CSV that opens cleanly in Excel: UTF-8 BOM, CRLF line endings,
 * oldest day first. Columns: Date, Day, Time recorded, Notes.
 */
export const buildCsv = (entries: CsvEntry[]): string => {
  const rows = [...entries].sort((a, b) => a.work_date.localeCompare(b.work_date))
  const lines = [['Date', 'Day', 'Time recorded', 'Notes'].map(csvField).join(',')]
  for (const e of rows) {
    const day = parseISO(e.work_date).toLocaleDateString('en-US', { weekday: 'long' })
    lines.push(
      [csvField(e.work_date), csvField(day), csvField(timeOf(e.recorded_at)), csvField(e.note ?? '')].join(','),
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
