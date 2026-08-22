import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const TEST_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';

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

async function globalSetup(config: FullConfig) {
  loadEnv();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Supabase not configured, skipping test user creation');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const userExists = existingUsers.users.some(u => u.email === TEST_USER_EMAIL);

  if (!userExists) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Test User' },
    });
    
    if (error) {
      console.error('Failed to create test user:', error.message);
    } else {
      console.log('Created test user:', data.user?.id);
    }
  } else {
    console.log('Test user already exists:', existingUsers.users.find(u => u.email === TEST_USER_EMAIL)?.id);
  }
}

export default globalSetup;