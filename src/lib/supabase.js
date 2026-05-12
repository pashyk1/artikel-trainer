import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ndcbgjnuztqzqcwdwlrd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kY2Jnam51enRxenFjd2R3bHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTY3MzgsImV4cCI6MjA5NDE3MjczOH0.BzpBjtAKqDaHT2xCJ6sm78zgZpdawgEmTYRhm_TLO2A'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
