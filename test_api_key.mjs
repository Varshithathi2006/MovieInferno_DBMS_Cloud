import { readFileSync } from 'fs';

// Load environment variables from .env.local
try {
  const envContent = readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.error('Error loading .env.local:', error.message);
}

async function testAPIKey() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    // Test with a simple HTTP request to list models
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    console.log('Testing API key with models endpoint...');
    const response = await fetch(url);
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid!');
      console.log('Available models:');
      data.models?.forEach(model => {
        console.log(`- ${model.name}`);
      });
    } else {
      const errorText = await response.text();
      console.log('❌ API Key test failed');
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API Key Test Failed:', error.message);
    console.error('Full error:', error);
  }
}

testAPIKey();