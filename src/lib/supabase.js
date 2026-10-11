import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** `null` quando as variáveis não existem → o app roda em modo demonstração (localStorage). */
export const supabase = url && key ? createClient(url, key) : null
