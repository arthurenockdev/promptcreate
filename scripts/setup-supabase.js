require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSupabase() {
  try {
    // Verify storage bucket
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw bucketsError;
    }

    const projectsBucket = buckets.find(b => b.name === 'projects');
    if (!projectsBucket) {
      throw new Error('Projects bucket not found. Please run the SQL setup script first.');
    }
    console.log('Storage bucket verified');

    // Test projects table access
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (projectsError) {
      throw projectsError;
    }

    console.log('Database table verified');
    console.log('Supabase setup verified successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupSupabase();
