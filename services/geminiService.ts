import { GoogleGenAI } from "@google/genai";
import { LogEntry } from "../types";

export const analyzeLogs = async (logs: LogEntry[], configSummary: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: Gemini API Key is missing. Please check your environment variables.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare the prompt
    const logText = logs.slice(-10).map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    
    const prompt = `
      You are an expert Network Engineer and System Administrator for LibreNMS.
      
      I have a LibreNMS Edge Agent running in an Ubuntu container.
      Here is the current configuration summary: ${configSummary}
      
      Here are the recent logs:
      ${logText}
      
      Please analyze these logs and provide:
      1. A summary of the problem (if any).
      2. Specific actionable steps to fix connectivity or SNMP issues.
      3. If the agent is behind NAT, verify if the settings look correct for that scenario.
      
      Keep the response concise and formatted in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while contacting the AI assistant. Please try again later.";
  }
};