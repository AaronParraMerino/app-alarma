import { supabase } from '../../db/supabaseClient'

export const insertAlarmCloud = async (alarm: any) => {
  const { error } = await supabase
    .from('alarms')
    .upsert([alarm]) // 👈 evita duplicados

  if (error) throw error
}

export const getAlarmsCloud = async () => {
  const { data, error } = await supabase
    .from('alarms')
    .select('*')

  if (error) throw error

  return data
}