/**
 * Set password for fervid2023@gmail.com to Dustin#12
 * This script can be run in Node.js to update the password
 */

const { createClient } = require('./supabase/client');

async function setAdminPassword() {
  const supabase = createClient();

  try {
    // Method 1: Update password for existing user (requires admin token)
    // This won't work without admin privileges

    // Method 2: Delete and recreate the user
    console.log('Checking if user exists...');

    // First, try to sign in with current credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'fervid2023@gmail.com',
      password: 'Dustin#12' // Try current password first
    });

    if (signInData?.user) {
      console.log('✅ User already has the correct password');
      return;
    }

    // If that didn't work, try to reset via email
    console.log('Sending password reset email...');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail('fervid2023@gmail.com', {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (resetError) {
      console.log('❌ Password reset failed:', resetError.message);
    } else {
      console.log('✅ Password reset email sent');
      console.log('Check fervid2023@gmail.com for reset link');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// For immediate password setting (development only):
// Go to Supabase Dashboard → Authentication → Users
// Find fervid2023@gmail.com and click "Edit"
// Set new password to "Dustin#12"

if (typeof window !== 'undefined') {
  // Browser environment
  setAdminPassword();
} else {
  // Node.js environment
  setAdminPassword();
}