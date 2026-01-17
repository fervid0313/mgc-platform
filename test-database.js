/**
 * Test if Supabase database is properly set up
 */

async function testDatabase() {
  console.log('🧪 Testing Supabase Database Setup...\n');

  try {
    // Import would work in browser environment
    console.log('Note: This test should be run in browser console at http://localhost:3002');
    console.log('Copy and paste this into browser console:\n');

    console.log(`
// Test Supabase connection and tables
async function testDB() {
  const { createClient } = await import('./lib/supabase/client.js');
  const supabase = createClient();

  console.log('Testing connection...');

  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connection OK');
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return;
  }

  // Test 2: Check if tables exist
  const tables = ['profiles', 'entries', 'friend_requests', 'connections', 'spaces'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.log(\`❌ Table '\${table}' error:\`, error.message);
      } else {
        console.log(\`✅ Table '\${table}' exists\`);
      }
    } catch (error) {
      console.log(\`❌ Table '\${table}' check failed:\`, error.message);
    }
  }

  // Test 3: Check auth
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user ? user.email : 'Not logged in');

  console.log('\\n🎯 If tables are missing, run the SQL scripts in Supabase dashboard!');
}

testDB();
`);

  } catch (error) {
    console.log('❌ Test setup failed:', error.message);
  }
}

testDatabase();