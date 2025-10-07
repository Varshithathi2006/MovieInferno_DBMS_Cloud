import fetch from 'node-fetch';

async function testChatbotAPI() {
  try {
    console.log('Testing Chatbot API...');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hi! Can you recommend some action movies?',
        userId: 'test-user-123'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Chatbot API Response:', data);
    
    if (data.response) {
      console.log('✅ Bot Response:', data.response);
    } else {
      console.log('❌ No response from bot');
    }

  } catch (error) {
    console.error('❌ Chatbot API Test Failed:', error.message);
  }
}

testChatbotAPI();