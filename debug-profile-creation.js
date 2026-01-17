// Debug profile creation issues
console.log('🔍 Debugging Profile Creation Issues...\n');

// Test database connection and profile insertion
async function testProfileCreation() {
  try {
    // This would run in browser console
    console.log('Run this in browser console at http://localhost:3004:\n');

    console.log(`
// Test profile creation
async function debugProfile() {
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing Supabase connection...');
    const { createClient } = await import('./lib/supabase/client.js');
    const supabase = createClient();

    // Test 2: Check if profiles table exists
    console.log('2. Checking if profiles table exists...');
    const { data: tableTest, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Profiles table error:', tableError);
      return;
    }
    console.log('✅ Profiles table exists');

    // Test 3: Check RLS policies
    console.log('3. Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('profiles')
      .insert({
        id: 'test-user-id',
        username: 'testuser',
        tag: '1234',
        email: 'test@example.com',
        bio: 'test bio',
        created_at: new Date().toISOString()
      });

    if (rlsError) {
      console.error('❌ RLS policy blocks insert:', rlsError);
      console.log('This means the table exists but RLS policies are blocking inserts');
    } else {
      console.log('✅ RLS policies allow inserts');
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', 'test-user-id');
    }

    // Test 4: Check current user auth
    console.log('4. Checking current auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Auth error:', authError);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);

      // Test 5: Try creating a profile for current user
      console.log('5. Testing profile creation for current user...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: 'debuguser',
          tag: '9999',
          email: user.email,
          bio: 'debug profile',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        console.log('Error code:', profileError.code);
        console.log('Error message:', profileError.message);
        console.log('Error details:', profileError.details);
      } else {
        console.log('✅ Profile creation succeeded');
        // Clean up
        await supabase.from('profiles').delete().eq('id', user.id);
      }

    } else {
      console.log('❌ No authenticated user');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugProfile();
`);

  } catch (error) {
    console.log('❌ Script generation failed:', error.message);
  }
}

testProfileCreation();