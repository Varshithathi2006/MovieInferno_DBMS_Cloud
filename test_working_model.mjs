import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = "AIzaSyAZy-eha-j1uQ4a3kvWF0V3dCur4w-5R8M";

async function testWorkingModel() {
  console.log('🔍 Testing different Gemini model names...');
  
  const modelsToTest = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest', 
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-flash',
    'gemini-2.0-flash-exp'
  ];
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`🧪 Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = "Hello, respond with just 'Working!'";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ SUCCESS with ${modelName}: ${text.trim()}`);
      return modelName; // Return the first working model
      
    } catch (error) {
      console.log(`❌ Failed with ${modelName}: ${error.message.split('\n')[0]}`);
    }
  }
  
  console.log('❌ No working models found');
  return null;
}

testWorkingModel();