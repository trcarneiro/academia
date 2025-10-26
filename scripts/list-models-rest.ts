
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not found in .env file");
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("Fetching available models...");
    
    // The listModels method is not directly on the genAI instance.
    // We need to get a generative model instance first, but that requires a model name.
    // This is a bit of a catch-22.
    // A different approach is needed, perhaps using the REST API directly if the library is difficult.
    // Let's try to call the discovery API endpoint.

    const discoveryUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    const response = await fetch(`${discoveryUrl}?key=${apiKey}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("--- Available Models for generateContent ---");
    if (data.models) {
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });
    }
    console.log("------------------------------------------");

  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
