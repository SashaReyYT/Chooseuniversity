import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { ProfileService } from '@/lib/services/profile.service';
import type { Database } from '@/types/database';

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

async function seedTestUser() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const TEST_USER_EMAIL = 'e2e-test@example.com';

  // Find the test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users.users.find(u => u.email === TEST_USER_EMAIL);

  if (!testUser) {
    console.error('Test user not found');
    process.exit(1);
  }

  console.log('Found test user:', testUser.id);

  // Create a service role client for the profile operations
  const profileSupabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  const profileService = new ProfileService(profileSupabase);

  // Seed a complete onboarding profile - using only columns that exist in schema
  await profileService.upsert(testUser.id, {
    full_name: 'E2E Test User',
    residence_country_code: 'UA',
    residence_city: 'Kyiv',
    preferred_country_codes: ['CZ', 'PL', 'DE'],
    education_stage: 'finished_school',
    current_education_level: 'high_school',
    has_graduated: true,
    preferred_degree_level: 'bachelor',
    start_year: 2026,
    primary_field_of_study_id: '8115daf8-3f2c-4279-9136-e915f0c29acb',
    preferred_field_of_study_ids: ['8115daf8-3f2c-4279-9136-e915f0c29acb'],
    preferred_language_codes: ['en', 'cs'],
    national_exam_type: 'nmt',
    budget_mode: 'medium',
    living_cost_mode: 'medium',
    wants_scholarship: true,
    wants_dormitory: true,
    wants_work_during_study: false,
    wants_stay_after_graduation: true,
    open_to_additional_exams: null,
    location_preference_type: 'capital_or_large_city',
    math_background: 'good',
    english_level: 'b2',
    preferred_cities: [],
    preferred_ownership_type: null,
    preferred_study_format: null,
    support_preference: null,
    budget_currency: 'EUR',
    budget_min: null,
    budget_max: null,
    current_gpa: null,
    current_gpa_scale: null,
  });

  console.log('Profile upserted');

  // Language proficiency
  await profileService.replaceLanguageProficiency(testUser.id, [
    { languageCode: 'en', level: 'b2' },
    { languageCode: 'cs', level: 'a1' },
  ]);
  console.log('Language proficiency set');

  // NMT scores (Ukraine)
  await profileService.replaceNmtScores(testUser.id, [
    { subjectCode: 'ukrainian_language', score: 180, maxScore: 200, testYear: 2025, isExpected: false },
    { subjectCode: 'mathematics', score: 175, maxScore: 200, testYear: 2025, isExpected: false },
    { subjectCode: 'english', score: 185, maxScore: 200, testYear: 2025, isExpected: false },
  ]);
  console.log('NMT scores set');

  // No subject strengths (has NMT scores)
  await profileService.replaceSubjectStrengths(testUser.id, []);
  console.log('Subject strengths cleared');

  console.log('Test user seeded successfully!');
  process.exit(0);
}

seedTestUser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});