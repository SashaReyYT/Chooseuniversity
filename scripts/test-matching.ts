import { createClient } from '@supabase/supabase-js';
import { MatchingService } from '@/lib/services/matching.service';
import type { Database } from '@/types/database';
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  
  // Test matching for the test user
  const testUserId = '3d0406e6-c165-4ade-b1ad-e3ad4f9c1591';
  const matching = new MatchingService(supabase);
  
  const matches = await matching.listMatchesForUser(testUserId);
  console.log(`Found ${matches.length} matches`);
  
  const withScore = matches.filter(m => m.match.overallScore != null);
  console.log(`Matches with score: ${withScore.length}`);
  
  for (const m of withScore.slice(0, 5)) {
    console.log(`- ${m.programme.name} (${m.programme.university.name}): ${m.match.overallScore}% - ${m.match.overallLabel}`);
  }
  
  // Also check what programmes are returned by search
  const programmes = await matching['programmes'].search({});
  console.log(`\nTotal programmes in search: ${programmes.length}`);
  const csProgrammes = programmes.filter(p => p.field_of_study_id === '8115daf8-3f2c-4279-9136-e915f0c29acb');
  console.log(`CS programmes: ${csProgrammes.length}`);
  for (const p of csProgrammes.slice(0, 5)) {
    console.log(`- ${p.name} (${p.university.name}, ${p.language_code}, tuition: ${p.tuition_min} ${p.tuition_currency})`);
  }
}

main().catch(console.error);