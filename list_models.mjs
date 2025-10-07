import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

async function listModels() {
    try {
        console.log('Loading environment variables...');
        
        // Load environment variables from .env.local
        let geminiApiKey;
        try {
            const envContent = readFileSync('.env.local', 'utf8');
            const envLines = envContent.split('\n');
            
            for (const line of envLines) {
                if (line.startsWith('GEMINI_API_KEY=')) {
                    geminiApiKey = line.split('=')[1].trim();
                    break;
                }
            }
        } catch (error) {
            console.log('Could not read .env.local, trying process.env...');
            geminiApiKey = process.env.GEMINI_API_KEY;
        }

        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }

        console.log('API Key exists:', !!geminiApiKey);
        console.log('API Key length:', geminiApiKey.length);

        const ai = new GoogleGenerativeAI(geminiApiKey);
        
        console.log('Listing available models...');
        const models = await ai.listModels();
        
        console.log('✅ Available models:');
        models.forEach(model => {
            console.log(`- ${model.name} (${model.displayName})`);
        });

    } catch (error) {
        console.error('❌ Error listing models:', error.message);
        console.error('Full error:', error);
    }
}

listModels();