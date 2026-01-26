// Supabase Configuration - Database Only
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://qrmdurbdjcmzeipysxlt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybWR1cmJkamNtemVpcHlzeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMDgzNTMsImV4cCI6MjA4Mzc4NDM1M30.aVquTu8faMh0LAAVE-j7V0TQXxmf4dEET35ymzJK2c0';

if (!window.supabase) {
  console.error("Supabase SDK not loaded");
}

// Only declare supabaseClient if it hasn't been declared already
let supabaseClient;
if (!window.supabaseClient) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} else {
  supabaseClient = window.supabaseClient;
}

if (!supabaseClient) {
  console.error("Supabase client creation failed");
}

// Authentication functions
async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    console.log('Session:', session);
    if (session) {
      console.log('Session user:', session.user);
      console.log('Session user ID:', session.user.id);
    }
    return session ? session.user : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    // Redirect to welcome page if not authenticated
    window.location.href = 'welcome.html';
    return false;
  }
  return true;
}

async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = 'welcome.html';
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// Listen for auth changes
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session ? 'User present' : 'No user');
  
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, redirecting to welcome page');
    window.location.href = 'welcome.html';
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
    console.log('Session established:', session);
    
    // Ensure user record exists in database
    if (session.user) {
      ensureUserExists(session.user).then(success => {
        if (success) {
          console.log('User record verified/created successfully');
        } else {
          console.warn('Failed to verify/create user record');
        }
      });
    }
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Session token refreshed');
  }
});

// Quiz management functions
// User management functions
async function ensureUserExists(user) {
  try {
    // Validate user data to prevent bot creation
    if (!user || !user.id || !user.email) {
      console.warn('Invalid user data - skipping user record creation');
      return false;
    }

    // Check for suspicious email patterns (bot detection)
    const email = user.email.toLowerCase();
    const suspiciousPatterns = [
      /^[0-9]+@/, // Numbers only at start
      /test.*@/, // Test emails
      /example.*@/, // Example emails
      /temp.*@/, // Temporary emails
      /fake.*@/, // Fake emails
      /bot.*@/, // Bot emails
      /\.tmp@/, // Temporary domains
      /\.test@/, // Test domains
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(email));
    
    if (isSuspicious) {
      console.warn('Suspicious email pattern detected - skipping user record creation:', email);
      return false;
    }

    // Check if user exists in users table
    const { data: userRecord, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user record:', userError);
      return false;
    }
    
    if (userRecord) {
      console.log('User record already exists');
      return true;
    }
    
    console.log('User not found in users table, attempting to create record...');
    
    // Additional validation before creating user
    if (user.email.length < 3 || !user.email.includes('@')) {
      console.warn('Invalid email format - skipping user record creation');
      return false;
    }

    // Try using RPC function if available (bypasses RLS)
    const { data, error } = await supabaseClient.rpc('create_user_if_not_exists', {
      user_id: user.id,
      user_email: user.email
    });
    
    if (error) {
      console.log('RPC function not available or failed:', error.message);
      console.log('Trying direct insert...');
      
      // Fallback to direct insert (may fail due to RLS)
      const { error: insertError } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log('Direct insert also failed:', insertError.message);
        console.log('User record creation failed - will try again when needed');
        return false;
      } else {
        console.log('User record created via direct insert');
      }
    } else {
      console.log('User record created via RPC function');
    }
    
    console.log('User record created successfully');
    return true;
  } catch (error) {
    console.error('Error in ensureUserExists:', error);
    return false;
  }
}

async function saveQuizToSupabase(quizData) {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Current user:', user);
    console.log('User ID:', user.id);
    console.log('User ID type:', typeof user.id);
    console.log('User ID length:', user.id ? user.id.length : 'null');

    // Create user record on-demand when actually saving data (more secure)
    await createUserRecordIfNeeded(user);

    // Process images to upload data URLs to Supabase Storage
    const processedQuizData = await processQuizImages({
      ...quizData,
      user_id: user.id
    });

    const quizToSave = {
      title: processedQuizData.title,
      instructions: processedQuizData.instructions || '',
      questions: processedQuizData.questions, // Now with storage URLs instead of data URLs
      user_id: user.id, // This now references auth.users directly
      updated_at: new Date().toISOString()
    };
    
    console.log('Quiz to save:', quizToSave);
    console.log('Questions data type:', typeof quizToSave.questions);
    console.log('Questions data:', quizToSave.questions);
    
    let result;
    if (quizData.id) {
      // Update existing quiz - ensure user owns it
      const { data, error } = await supabaseClient
        .from('quizzes')
        .update(quizToSave)
        .eq('id', quizData.id)
        .eq('user_id', user.id) // Ensure user owns the quiz
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Create new quiz
      quizToSave.created_at = new Date().toISOString();
      const { data, error } = await supabaseClient
        .from('quizzes')
        .insert(quizToSave)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    }
    
    console.log('Quiz saved successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving quiz:', error);
    return { success: false, error: error.message };
  }
}

async function duplicateQuizToSupabase(quizData) {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create user record on-demand when actually saving data
    await createUserRecordIfNeeded(user);

    const quizToSave = {
      title: quizData.title,
      instructions: quizData.instructions || '',
      questions: quizData.questions, // Keep as array - Supabase will handle JSON conversion
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create new quiz (no id field means insert)
    const { data, error } = await supabaseClient
      .from('quizzes')
      .insert(quizToSave)
      .select()
      .single();
      
    if (error) throw error;
    
    console.log('Quiz duplicated successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error duplicating quiz:', error);
    return { success: false, error: error.message };
  }
}

// Create user record only when actually needed (on-demand)
async function createUserRecordIfNeeded(user) {
  try {
    // Check if user exists in users table
    const { data: userRecord, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user record:', userError);
      return false;
    }
    
    if (userRecord) {
      console.log('User record already exists');
      return true;
    }
    
    console.log('Creating user record on-demand for:', user.email);
    
    // Create user record
    const { error: insertError } = await supabaseClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Failed to create user record:', insertError.message);
      return false;
    }
    
    console.log('User record created successfully on-demand');
    return true;
  } catch (error) {
    console.error('Error in createUserRecordIfNeeded:', error);
    return false;
  }
}

async function loadQuizzesFromSupabase() {
  try {
    // Show loading overlay for load operation
    return await window.LoadingUtils.withLoadingOverlay(async () => {
      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabaseClient
        .from("quizzes")
        .select("*")
        .eq('user_id', user.id) // Only load user's own quizzes
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data;
    }, 'Loading quizzes...');
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return [];
  }
}

async function deleteQuizFromSupabase(quizId) {
  try {
    // Show loading overlay for delete operation
    return await window.LoadingUtils.withLoadingOverlay(async () => {
      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabaseClient
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('user_id', user.id); // Ensure user owns the quiz
        
      if (error) throw error;
      return { success: true };
    }, 'Deleting quiz...');
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return { success: false, error: error.message };
  }
}

async function loadQuizFromSupabase(quizId) {
  try {
    console.log('loadQuizFromSupabase called with ID:', quizId);
    
    // Show loading overlay for quiz loading
    return await window.LoadingUtils.withLoadingOverlay(async () => {
      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError) {
        console.error('Auth error in loadQuizFromSupabase:', authError);
        throw authError;
      }
      if (!user) {
        console.error('User not authenticated in loadQuizFromSupabase');
        throw new Error('User not authenticated');
      }

      console.log('User authenticated, loading quiz:', quizId, 'for user:', user.id);

      const { data, error } = await supabaseClient
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('user_id', user.id) // Ensure user owns the quiz
        .single();
        
      if (error) {
        console.error('Database error in loadQuizFromSupabase:', error);
        throw error;
      }
      
      console.log('Raw quiz data from database:', data);
      console.log('Questions field type:', typeof data.questions);
      console.log('Questions field value:', data.questions);
      
      // Handle questions data - Supabase might return it as string or object
      if (data && data.questions && typeof data.questions === 'string') {
        try {
          data.questions = JSON.parse(data.questions);
          console.log('Parsed questions from JSON string:', data.questions);
        } catch (parseError) {
          console.error('Error parsing questions JSON:', parseError);
          data.questions = [];
        }
      }
      
      console.log('Final quiz data to return:', data);
      return data;
    }, 'Loading quiz...');
  } catch (error) {
    console.error('Error in loadQuizFromSupabase:', error);
    return null;
  }
}

// Autosave functions
async function saveAutosaveToSupabase(quizData) {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create user record on-demand when actually saving data
    await createUserRecordIfNeeded(user);

    const autosaveData = {
      id: user.id, // Use user ID as the autosave ID
      user_id: user.id,
      quiz_data: {
        ...quizData,
        id: 'autosave_current',
        isAutosave: true,
        autosavedAt: new Date().toISOString()
      },
      autosaved_at: new Date().toISOString()
    };
    
    const { data, error } = await supabaseClient
      .from('quiz_autosaves')
      .upsert(autosaveData, {
        onConflict: 'id'
      })
      .select()
      .single();
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving autosave:', error);
    return { success: false, error: error.message };
  }
}

async function loadAutosaveFromSupabase() {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('quiz_autosaves')
      .select('*')
      .eq('id', user.id)
      .eq('user_id', user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data ? data.quiz_data : null;
  } catch (error) {
    console.error('Error loading autosave:', error);
    return null;
  }
}

async function clearAutosaveFromSupabase() {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabaseClient
      .from('quiz_autosaves')
      .delete()
      .eq('id', user.id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error clearing autosave:', error);
    return { success: false, error: error.message };
  }
}

// Delete user account completely (including auth)
async function deleteUserAccount() {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Starting account deletion for user:', user.id);

    // Delete user's data from all tables first
    // Delete quizzes
    const { error: quizzesError } = await supabaseClient
      .from('quizzes')
      .delete()
      .eq('user_id', user.id);
    
    if (quizzesError) {
      console.error('Error deleting quizzes:', quizzesError);
      throw quizzesError;
    }

    // Delete autosave data
    const { error: autosaveError } = await supabaseClient
      .from('quiz_autosaves')
      .delete()
      .eq('user_id', user.id);
    
    if (autosaveError) {
      console.error('Error deleting autosaves:', autosaveError);
      throw autosaveError;
    }

    // Delete user record from users table if it exists
    const { error: userError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', user.id);
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error deleting user record:', userError);
      throw userError;
    }

    // Delete the user from auth system using admin API
    // This requires service role key, so we'll use a server function if available
    // For now, we'll use the client-side method which has limitations
    try {
      const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(
        user.id
      );
      
      if (deleteAuthError) {
        console.warn('Admin delete failed (expected with client key):', deleteAuthError.message);
        // Fallback: try to delete user using RPC function if available
        const { error: rpcError } = await supabaseClient.rpc('delete_user_account', {
          user_id_to_delete: user.id
        });
        
        if (rpcError) {
          console.warn('RPC delete failed:', rpcError.message);
          // As a last resort, we'll at least sign out the user
          console.log('Cannot delete auth user with client permissions - signing out only');
        } else {
          console.log('User deleted via RPC function successfully');
        }
      } else {
        console.log('User deleted from auth system successfully');
      }
    } catch (adminError) {
      console.warn('Admin API not available:', adminError.message);
      // Try RPC fallback
      try {
        const { error: rpcError } = await supabaseClient.rpc('delete_user_account', {
          user_id_to_delete: user.id
        });
        
        if (rpcError) {
          console.warn('RPC delete also failed:', rpcError.message);
        } else {
          console.log('User deleted via RPC function successfully');
        }
      } catch (rpcError) {
        console.warn('RPC fallback failed:', rpcError.message);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error: error.message };
  }
}

// Email verification functions
async function resendVerificationEmail() {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email: user.email,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, error: error.message };
  }
}

async function checkEmailVerification() {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      return { verified: false, error: 'User not authenticated' };
    }
    
    // Refresh the session to get the latest email confirmation status
    const { data: { session }, error: refreshError } = await supabaseClient.auth.refreshSession();
    
    if (refreshError) throw refreshError;
    
    return { 
      verified: session.user.email_confirmed_at !== null,
      user: session.user 
    };
  } catch (error) {
    console.error('Error checking email verification:', error);
    return { verified: false, error: error.message };
  }
}

// Show email verification modal
function showEmailVerificationModal(email) {
  const modal = document.getElementById('emailVerificationModal');
  const emailSpan = document.getElementById('verificationEmail');
  
  if (modal && emailSpan) {
    emailSpan.textContent = email;
    modal.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
      modal.querySelector('.modal-content').style.transform = 'scale(1)';
      modal.querySelector('.modal-content').style.opacity = '1';
    }, 100);
  }
}

// Close email verification modal
function closeEmailVerificationModal() {
  const modal = document.getElementById('emailVerificationModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Password reset functions
async function resetPassword(email) {
  try {
    // First check if user exists
    const { data: { users }, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: 'dummy-password-to-check-user-existence'
    });
    
    // If we get "Invalid login credentials", the user exists but password is wrong
    // If we get other errors, the user might not exist
    if (signInError && !signInError.message.includes('Invalid login credentials')) {
      // User likely doesn't exist
      return { 
        success: false, 
        error: 'This email is not registered. Please sign up first.' 
      };
    }
    
    // User exists, proceed with password reset
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/html/reset-password.html`,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

// Show forgot password modal
function showForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) {
    modal.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
      modal.querySelector('.modal-content').style.transform = 'scale(1)';
      modal.querySelector('.modal-content').style.opacity = '1';
    }, 100);
  }
}

// Close forgot password modal
function closeForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) {
    modal.style.display = 'none';
    // Clear form
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
      form.reset();
    }
  }
}

// Image upload functions using Supabase Storage
async function uploadImageToSupabase(file, userId, quizId = null) {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('quiz-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('quiz-images')
      .getPublicUrl(fileName);

    return {
      success: true,
      path: fileName,
      url: publicUrl,
      name: file.name
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
}

async function deleteImageFromSupabase(imagePath) {
  try {
    const { error } = await supabaseClient.storage
      .from('quiz-images')
      .remove([imagePath]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
}

// Process quiz data to upload images and replace data URLs with storage references
async function processQuizImages(quizData) {
  try {
    const processedQuiz = JSON.parse(JSON.stringify(quizData)); // Deep copy
    
    // Process question images
    for (const question of processedQuiz.questions) {
      if (question.images && question.images.length > 0) {
        const processedImages = [];
        for (const imageData of question.images) {
          if (imageData.src && imageData.src.startsWith('data:')) {
            // Convert data URL to blob and upload
            const response = await fetch(imageData.src);
            const blob = await response.blob();
            const file = new File([blob], imageData.name || 'image', { type: blob.type });
            
            const uploadResult = await uploadImageToSupabase(file, processedQuiz.user_id || 'temp', processedQuiz.id);
            if (uploadResult.success) {
              processedImages.push({
                src: uploadResult.url,
                path: uploadResult.path,
                name: imageData.name || 'image'
              });
            } else {
              console.error('Failed to upload question image:', uploadResult.error);
              // Keep original data URL as fallback
              processedImages.push(imageData);
            }
          } else {
            // Already a URL, keep as is
            processedImages.push(imageData);
          }
        }
        question.images = processedImages;
      }

      // Process option images for multiple choice
      if (question.options && Array.isArray(question.options)) {
        for (const option of question.options) {
          if (option.images && option.images.length > 0) {
            const processedImages = [];
            for (const imageData of option.images) {
              if (imageData.src && imageData.src.startsWith('data:')) {
                const response = await fetch(imageData.src);
                const blob = await response.blob();
                const file = new File([blob], imageData.name || 'image', { type: blob.type });
                
                const uploadResult = await uploadImageToSupabase(file, processedQuiz.user_id || 'temp', processedQuiz.id);
                if (uploadResult.success) {
                  processedImages.push({
                    src: uploadResult.url,
                    path: uploadResult.path,
                    name: imageData.name || 'image'
                  });
                } else {
                  console.error('Failed to upload option image:', uploadResult.error);
                  processedImages.push(imageData);
                }
              } else {
                processedImages.push(imageData);
              }
            }
            option.images = processedImages;
          }
        }
      }

      // Process matching pair images
      if (question.pairs && Array.isArray(question.pairs)) {
        for (const pair of question.pairs) {
          // Process left images
          if (pair.leftImages && pair.leftImages.length > 0) {
            const processedImages = [];
            for (const imageData of pair.leftImages) {
              if (imageData.src && imageData.src.startsWith('data:')) {
                const response = await fetch(imageData.src);
                const blob = await response.blob();
                const file = new File([blob], imageData.name || 'image', { type: blob.type });
                
                const uploadResult = await uploadImageToSupabase(file, processedQuiz.user_id || 'temp', processedQuiz.id);
                if (uploadResult.success) {
                  processedImages.push({
                    src: uploadResult.url,
                    path: uploadResult.path,
                    name: imageData.name || 'image'
                  });
                } else {
                  console.error('Failed to upload left image:', uploadResult.error);
                  processedImages.push(imageData);
                }
              } else {
                processedImages.push(imageData);
              }
            }
            pair.leftImages = processedImages;
          }

          // Process right images
          if (pair.rightImages && pair.rightImages.length > 0) {
            const processedImages = [];
            for (const imageData of pair.rightImages) {
              if (imageData.src && imageData.src.startsWith('data:')) {
                const response = await fetch(imageData.src);
                const blob = await response.blob();
                const file = new File([blob], imageData.name || 'image', { type: blob.type });
                
                const uploadResult = await uploadImageToSupabase(file, processedQuiz.user_id || 'temp', processedQuiz.id);
                if (uploadResult.success) {
                  processedImages.push({
                    src: uploadResult.url,
                    path: uploadResult.path,
                    name: imageData.name || 'image'
                  });
                } else {
                  console.error('Failed to upload right image:', uploadResult.error);
                  processedImages.push(imageData);
                }
              } else {
                processedImages.push(imageData);
              }
            }
            pair.rightImages = processedImages;
          }
        }
      }
    }

    return processedQuiz;
  } catch (error) {
    console.error('Error processing quiz images:', error);
    return quizData; // Return original data if processing fails
  }
}

// Export functions for global access
window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.logout = logout;
window.saveQuizToSupabase = saveQuizToSupabase;
window.duplicateQuizToSupabase = duplicateQuizToSupabase;
window.loadQuizzesFromSupabase = loadQuizzesFromSupabase;
window.deleteQuizFromSupabase = deleteQuizFromSupabase;
window.loadQuizFromSupabase = loadQuizFromSupabase;
window.saveAutosaveToSupabase = saveAutosaveToSupabase;
window.loadAutosaveFromSupabase = loadAutosaveFromSupabase;
window.clearAutosaveFromSupabase = clearAutosaveFromSupabase;
window.deleteUserAccount = deleteUserAccount;
window.createUserRecordIfNeeded = createUserRecordIfNeeded;
window.resendVerificationEmail = resendVerificationEmail;
window.checkEmailVerification = checkEmailVerification;
window.showEmailVerificationModal = showEmailVerificationModal;
window.closeEmailVerificationModal = closeEmailVerificationModal;
window.resetPassword = resetPassword;
window.showForgotPasswordModal = showForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.uploadImageToSupabase = uploadImageToSupabase;
window.deleteImageFromSupabase = deleteImageFromSupabase;
window.processQuizImages = processQuizImages;
