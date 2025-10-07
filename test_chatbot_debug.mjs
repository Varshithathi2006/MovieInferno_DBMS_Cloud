async function testChatbotAPI() {
  try {
    console.log('Testing Chatbot API...');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you recommend a good action movie?',
        userId: '550e8400-e29b-41d4-a716-446655440000'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response:', data);

  } catch (error) {
    console.error('❌ Network/Fetch Error:', error.message);
    console.error('Full error:', error);
  }
}

testChatbotAPI();