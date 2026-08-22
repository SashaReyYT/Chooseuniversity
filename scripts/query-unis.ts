import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

async function main() {
  loadEnv();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Check universities in CZ
  const { data: unis } = await supabase.from('universities').select('id, name, country_code, city').eq('country_code', 'CZ');
  console.log('Czech universities:', unis);
  
  // Check Computer Science programmes in Czech universities
  const { data: csProgrammes } = await supabase
    .from('programmes')
    .select('id, name, university_id, field_of_study_id, language_code')
    .eq('field_of_study_id', '8115daf8-3f2c-4279-9136-e915f0c29acb')
    .eq('language_code', 'en');
  console.log('CS programmes:', csProgrammes);
}

main();