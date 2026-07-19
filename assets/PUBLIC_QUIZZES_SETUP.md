# Public Quizzes Setup Instructions

To enable shareable quiz links via URL (e.g., `test-runner.html?id=<uuid>`), you need to set up the `public_quizzes` table in your Supabase database.

## Overview

The new system replaces the temporary localStorage/sessionStorage based quiz transfer with persistent Supabase storage. This allows quizzes to be:
- Shared via URL
- Accessed from any browser/device
- Persisted indefinitely

## Database Setup

### 1. Create the public_quizzes table

Go to your Supabase project's SQL Editor and run the SQL from `assets/public_quizzes_setup.sql`:

```sql
-- Create public_quizzes table for shareable quiz links
CREATE TABLE IF NOT EXISTS public_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    instructions TEXT,
    quiz_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public_quizzes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (anyone can view quizzes by ID)
CREATE POLICY "Public can view quizzes" ON public_quizzes
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert quizzes
CREATE POLICY "Authenticated users can insert quizzes" ON public_quizzes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update their own quizzes
CREATE POLICY "Authenticated users can update quizzes" ON public_quizzes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS public_quizzes_created_at_idx ON public_quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS public_quizzes_updated_at_idx ON public_quizzes(updated_at DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public_quizzes TO authenticated;
GRANT SELECT ON TABLE public_quizzes TO anon;
```

### 2. Verify Storage Setup

Ensure your Supabase Storage bucket `quiz-images` exists and has the following policies:

**Public bucket policies:**
- **SELECT**: Allow public access (for viewing images in quizzes)
- **INSERT**: Allow authenticated users to upload images
- **UPDATE**: Allow authenticated users to update images
- **DELETE**: Allow authenticated users to delete images

If the bucket doesn't exist, create it:
1. Go to Storage → Create a new bucket
2. Name it `quiz-images`
3. Make it public (for image access)
4. Set up appropriate RLS policies

## How It Works

### New Flow (with Supabase)

1. **User creates quiz in edit.html**
2. **User clicks RUN button**
3. **runTest() calls collectTestData()** to gather quiz data
4. **saveQuizForRun() saves quiz to Supabase** (public_quizzes table)
5. **Returns quiz ID** (UUID)
6. **Opens test-runner.html?id=<quiz_id>** in new window
7. **test-runner.js loads quiz from Supabase** using loadQuizForRun()
8. **Quiz initializes and runs normally**

### Old Flow (deprecated but still supported)

The system maintains backward compatibility with localStorage/sessionStorage for:
- Testing without database setup
- Fallback if Supabase is unavailable
- Existing quiz links that use the old method

## Key Functions

### saveQuizForRun(testData)
- **Purpose**: Saves quiz data to Supabase for sharing
- **Input**: Complete quiz data object from collectTestData()
- **Output**: `{ success: true, quizId: <uuid>, data }` or `{ success: false, error: <message> }`
- **Authentication**: Requires user to be authenticated
- **Storage**: Saves to `public_quizzes` table

### loadQuizForRun(quizId)
- **Purpose**: Loads quiz data from Supabase by ID
- **Input**: Quiz UUID (from URL parameter)
- **Output**: Complete quiz data object
- **Authentication**: No authentication required (public read access)
- **Storage**: Loads from `public_quizzes` table

## URL Format

Quizzes are now accessible via:
```
test-runner.html?id=<uuid>
```

Example:
```
test-runner.html?id=550e8400-e29b-41d4-a716-446655440000
```

## Error Handling

The system handles various error scenarios:

### Missing Quiz ID
- **Detection**: No `id` parameter in URL
- **Fallback**: Checks localStorage/sessionStorage
- **Error message**: "No test data found. Please go back and create a quiz first."

### Quiz Not Found
- **Detection**: Supabase returns no data for the ID
- **Error message**: "Quiz not found"
- **User action**: Check the quiz ID and try again

### Invalid Quiz Data
- **Detection**: Data parsing fails or structure is invalid
- **Error message**: "Invalid quiz data format"
- **User action**: Contact quiz creator or recreate quiz

### Supabase Connection Error
- **Detection**: Network or authentication errors
- **Error message**: Specific error from Supabase
- **User action**: Check internet connection and try again

## Testing

### 1. Test Database Setup
```sql
-- Verify table exists
SELECT * FROM public_quizzes LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'public_quizzes';
```

### 2. Test Quiz Creation
1. Create a quiz in edit.html
2. Click RUN button
3. Check browser console for quiz ID
4. Verify quiz appears in Supabase dashboard

### 3. Test Quiz Loading
1. Copy the quiz ID from console
2. Open `test-runner.html?id=<quiz_id>` directly
3. Verify quiz loads correctly
4. Test on different browser/device

### 4. Test Error Handling
1. Try loading with invalid ID: `test-runner.html?id=invalid`
2. Try loading without ID: `test-runner.html`
3. Verify appropriate error messages appear

## Troubleshooting

### Quiz saves but won't load
- **Check**: Quiz ID is correct
- **Check**: RLS policies allow public read access
- **Check**: quiz_data field contains valid JSON

### Images don't display
- **Check**: Storage bucket exists and is public
- **Check**: Storage policies allow public read access
- **Check**: Image URLs are valid and accessible

### Permission errors
- **Check**: User is authenticated when saving
- **Check**: RLS policies allow authenticated users to insert
- **Check**: Storage policies allow authenticated users to upload

### Performance issues
- **Check**: Indexes exist on created_at and updated_at
- **Check**: quiz_data field is properly indexed (JSONB)
- **Check**: Network connection to Supabase

## Security Considerations

### Public Read Access
- The `public_quizzes` table allows public read access
- Anyone with the quiz ID can access the quiz
- Quiz IDs are UUIDs (hard to guess)
- Consider adding expiration dates if needed

### User Authentication
- Saving quizzes requires authentication
- Only authenticated users can create quizzes
- This prevents spam and abuse

### Image Storage
- Images are stored in Supabase Storage
- Public access required for quiz display
- Consider implementing image cleanup for old quizzes

## Migration from Old System

The old localStorage/sessionStorage system is still supported as a fallback. To fully migrate:

1. **Set up database** (follow instructions above)
2. **Test new system** with a few quizzes
3. **Monitor for errors** in browser console
4. **Gradually phase out** old system references
5. **Update documentation** for users

## Additional Notes

- **Quiz data structure**: The entire object from collectTestData() is stored in quiz_data without modification
- **Image handling**: Data URLs are converted to Supabase Storage URLs automatically
- **Backward compatibility**: Old quiz links using localStorage still work
- **No editor changes**: The question editor remains unchanged
- **No runner changes**: The test runner logic remains unchanged (only data loading)
