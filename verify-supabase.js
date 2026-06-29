#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Connection Verification\n');
console.log('═══════════════════════════════════\n');

// 1. Check if URL is loaded
console.log('1. Checking VITE_SUPABASE_URL...');
if (supabaseUrl) {
  console.log(`   ✅ VITE_SUPABASE_URL loaded: ${supabaseUrl}`);
} else {
  console.log('   ❌ VITE_SUPABASE_URL not found');
}

// 2. Check if ANON_KEY is loaded
console.log('\n2. Checking VITE_SUPABASE_ANON_KEY...');
if (supabaseAnonKey) {
  const keyPreview = supabaseAnonKey.substring(0, 20) + '...';
  console.log(`   ✅ VITE_SUPABASE_ANON_KEY loaded: ${keyPreview}`);
} else {
  console.log('   ❌ VITE_SUPABASE_ANON_KEY not found');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Cannot proceed: missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 3. Test query against site_settings table
console.log('\n3. Testing query against site_settings table...');
(async () => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    } else {
      console.log(`   ✅ Query successful! Retrieved ${data?.length || 0} record(s)`);
      if (data && data.length > 0) {
        console.log(`   Sample data: ${JSON.stringify(data[0], null, 2).split('\n').slice(0, 5).join('\n')}`);
      }
    }
  } catch (err) {
    console.log(`   ❌ Connection error: ${err.message}`);
  }

  // 4. Test Storage bucket access
  console.log('\n4. Testing access to website-assets storage bucket...');
  try {
    const { data, error } = await supabase
      .storage
      .from('website-assets')
      .list('', { limit: 1 });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Storage bucket accessible! Found ${data?.length || 0} item(s)`);
    }
  } catch (err) {
    console.log(`   ❌ Storage error: ${err.message}`);
  }

  // Summary
  console.log('\n═══════════════════════════════════');
  console.log('✅ Verification complete!');
})();
