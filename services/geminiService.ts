
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, SessionTemplate } from "../types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateSessionTemplate = async (topic: string): Promise<SessionTemplate> => {
  // Always use the API key from process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are an expert CBT Therapist and Clinical Psychologist. 
    Your goal is to create structured therapy session templates based on a given topic.
    The output must be a valid JSON object matching the requested schema.
    Ensure questions are clinically relevant, empathetic, and follow logical progression.
    Use branching logic where appropriate for MCQ questions to handle 'Yes/No' or severity screening.
    
    Question Types available:
    - TEXT: Open ended response
    - MCQ: Multiple choice (single select)
    - SLIDER: 1-10 or similar scales
    - CHECKBOX: Multi-select
    - INFO: Just text display, no input (avoid unless necessary for instructions)
  `;

  // Define the schema for structured output using Type from @google/genai
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the session" },
      description: { type: Type.STRING, description: "Brief description of the session goals" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { 
              type: Type.STRING, 
              enum: [
                QuestionType.TEXT, 
                QuestionType.MCQ, 
                QuestionType.SLIDER, 
                QuestionType.CHECKBOX, 
                QuestionType.INFO
              ] 
            },
            prompt: { type: Type.STRING },
            description: { type: Type.STRING, nullable: true },
            min: { type: Type.NUMBER, nullable: true },
            max: { type: Type.NUMBER, nullable: true },
            minLabel: { type: Type.STRING, nullable: true },
            maxLabel: { type: Type.STRING, nullable: true },
            options: {
              type: Type.ARRAY,
              nullable: true,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                },
                required: ["label", "value"]
              }
            }
          },
          required: ["type", "prompt"]
        }
      }
    },
    required: ["title", "description", "questions"]
  };

  // Using gemini-3-pro-preview for complex clinical reasoning and structured content generation.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create a CBT session template for: ${topic}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  // Extract text content directly from the response object
  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const data = JSON.parse(text);

  // Post-process to add IDs which AI might not generate reliably or uniquely enough
  const processedQuestions = data.questions.map((q: any) => ({
    ...q,
    id: generateId(),
    options: q.options?.map((o: any) => ({ ...o, id: generateId() }))
  }));

  return {
    id: generateId(),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: data.title,
    description: data.description,
    questions: processedQuestions
  };
};
