import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phppszuaprzpvfmmawzz.supabase.co';
const supabaseAnonKey = 'sb_publishable_0ktpxuH1RDJRytHyXAAELA_FFuTtsyA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWrite() {
  try {
    const id = 'test_id_key';
    const content = 'Hello from test script ' + new Date().toISOString();
    
    console.log('Attempting upsert...');
    const { data, error } = await supabase
      .from('site_content')
      .upsert({ id, content, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select();
      
    if (error) {
      console.error('Upsert failed:', error);
    } else {
      console.log('Upsert succeeded! Data:', data);
    }
  } catch (e) {
    console.error('Exception during test write:', e);
  }
}

testWrite();
