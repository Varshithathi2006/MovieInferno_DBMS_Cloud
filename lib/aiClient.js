// lib/aiClient.js

import { GoogleGenAI } from '@google/genai';

// The client securely reads the key from the environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;

// Check to prevent errors if the key is missing during deployment
if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

// Create and export the Gemini client instance
export const ai = new GoogleGenAI(geminiApiKey);