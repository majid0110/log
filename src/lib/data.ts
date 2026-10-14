import { supabase } from './supabase'

export interface Entry {
  id: string
  work_date: string
  recorded_at: string
  note: string | null
  source: 'tap' | 'manual'
}

const COLUMNS = 'id, work_date, recorded_at, note, source'

const explain = (error: { code?: string; message: string }): Error =>
  new Error(error.code === '23505' ? 'That day is already recorded.' : error.message)

export async function listEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select(COLUMNS)
    .order('work_date', { ascending: false })
    .limit(5000)
  if (error) throw explain(error)
  return data as Entry[]
}

export async function addEntry(workDate: string, note: string, source: 'tap' | 'manual'): Promise<Entry> {
  const { data, error } = await supabase
    .from('attendance')
    .insert({ work_date: workDate, note: note.trim() || null, source })
    .select(COLUMNS)
    .single()
  if (error) throw explain(error)
  return data as Entry
}

export async function updateEntry(id: string, workDate: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('attendance')
    .update({ work_date: workDate, note: note.trim() || null })
    .eq('id', id)
  if (error) throw explain(error)
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('attendance').delete().eq('id', id)
  if (error) throw explain(error)
}
