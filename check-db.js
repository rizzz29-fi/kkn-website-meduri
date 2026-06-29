import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phppszuaprzpvfmmawzz.supabase.co';
const supabaseAnonKey = 'sb_publishable_0ktpxuH1RDJRytHyXAAELA_FFuTtsyA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*');
    
    if (error) {
      console.error('Error fetching site_content:', error);
    } else {
      console.log('Site content data:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

check();
