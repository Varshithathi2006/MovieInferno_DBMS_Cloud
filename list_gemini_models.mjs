import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = "AIzaSyAZy-eha-j1uQ4a3kvWF0V3dCur4w-5R8M";

async function listAvailableModels() {
  console.log('🔍 Listing available Gemini models...');
  
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    console.log('📋 Fetching available models...');
    const models = await genAI.listModels();
    
    console.log('✅ Available models:');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    });
    
    // Test with the first available model that supports generateContent
    const availableModel = models.find(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    );
    
    if (availableModel) {
      console.log(`🧪 Testing with model: ${availableModel.name}`);
      const model = genAI.getGenerativeModel({ model: availableModel.name.replace('models/', '') });
      
      const prompt = "Hello, this is a test message. Please respond with 'Test successful!'";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Test successful! Response:', text);
    } else {
      console.log('❌ No models support generateContent method');
    }
    
  } catch (error) {
    console.error('❌ Error listing models:', error);
  }
}

listAvailableModels();