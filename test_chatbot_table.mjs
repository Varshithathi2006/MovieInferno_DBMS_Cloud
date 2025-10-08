import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajnkisostsjhoqfyjsqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbmtpc29zdHNqaG9xZnlqc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY0MjQsImV4cCI6MjA3MTk3MjQyNH0.KMvKbgeF2xeCwrFSGXHA0NLqZ9_94kIBs0CiSjkuBkg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChatbotTable() {
  console.log('🔍 Checking chatbot_history table structure...');
  
  try {
    // Check if table exists and get structure
    const { data, error } = await supabase
      .from('chatbot_history')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing chatbot_history table:', error);
      return;
    }
    
    console.log('✅ chatbot_history table exists and is accessible');
    console.log('Sample data structure:', data);
    
    // Try to insert a test record to check column structure
    const testUserId = '4f17cd3f-425e-4517-b4bd-1bbd82a181ae';
    const { data: insertData, error: insertError } = await supabase
      .from('chatbot_history')
      .insert({
        user_id: testUserId,
        role: 'user',
        content: 'Test message'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
    } else {
      console.log('✅ Test insert successful:', insertData);
      
      // Clean up test record
      await supabase
        .from('chatbot_history')
        .delete()
        .eq('id', insertData[0].id);
      console.log('✅ Test record cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkChatbotTable();