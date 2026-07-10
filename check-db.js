import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://phppszuaprzpvfmmawzz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocHBzenVhcHJ6cHZmbW1hd3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTY1NTksImV4cCI6MjA5NTA3MjU1OX0.M3CCBEFgyogaNr1B1LtQlOY07_XZeSLrRkbiAa4Kwfk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('site_content').select('*')
  console.log('Error:', error)
  console.log('Data:', data)
}
check()
