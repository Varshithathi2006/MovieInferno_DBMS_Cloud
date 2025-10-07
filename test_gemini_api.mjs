import { GoogleGenerativeAI } from '@google/generative-ai';
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

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API...');
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!geminiApiKey);
    console.log('API Key length:', geminiApiKey ? geminiApiKey.length : 0);
    
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    const ai = new GoogleGenerativeAI(geminiApiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log('Sending test request to Gemini...');
    
    const result = await model.generateContent("Say hello in one word");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API Response:', text);
    
  } catch (error) {
    console.error('❌ Gemini API Test Failed:', error.message);
    console.error('Full error:', error);
  }
}

testGeminiAPI();