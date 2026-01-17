/**
 * Quick Supabase connection test
 */

async function testConnection() {
  console.log('🧪 Testing Supabase connection...');

  try {
    // Dynamic import to avoid module issues
    const { createClient } = await import('./lib/supabase/client.js');

    const supabase = createClient();

    console.log('✅ Client created');

    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Database connection OK');
    }

    // Test auth
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Auth check failed:', sessionError.message);
    } else {
      console.log('✅ Auth system OK');
    }

  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

testConnection();