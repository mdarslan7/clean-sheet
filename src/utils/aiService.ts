export interface AIErrorFix {
  suggestedValue: string;
  explanation: string;
  confidence: number;
}

export interface AIErrorFixRequest {
  error: {
    entityType: 'clients' | 'workers' | 'tasks';
    rowId: string;
    field: string;
    message: string;
    severity: 'error' | 'warning';
  };
  currentData: any;
  allData: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
}

export async function getErrorFixSuggestion(request: AIErrorFixRequest): Promise<AIErrorFix> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
  }

  const prompt = generateErrorFixPrompt(request);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    return parseAIResponse(aiResponse);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

function generateErrorFixPrompt(request: AIErrorFixRequest): string {
  const { error, currentData, allData } = request;
  
  return `You are a data validation expert. Analyze the following validation error and suggest a specific fix.

ERROR DETAILS:
- Entity Type: ${error.entityType}
- Row ID: ${error.rowId}
- Field: ${error.field}
- Error Message: ${error.message}
- Severity: ${error.severity}

CURRENT DATA:
${JSON.stringify(currentData, null, 2)}

ALL AVAILABLE DATA:
Clients (${allData.clients.length} records): ${JSON.stringify(allData.clients.slice(0, 3), null, 2)}
Workers (${allData.workers.length} records): ${JSON.stringify(allData.workers.slice(0, 3), null, 2)}
Tasks (${allData.tasks.length} records): ${JSON.stringify(allData.tasks.slice(0, 3), null, 2)}

INSTRUCTIONS:
1. Analyze the error and the current data
2. Suggest a specific value that would fix this validation error
3. Provide a clear explanation of why this fix makes sense
4. Rate your confidence in this suggestion (0-100)

RESPONSE FORMAT (JSON only):
{
  "suggestedValue": "the specific value to fix the error",
  "explanation": "clear explanation of why this fix works",
  "confidence": 85
}

Examples:
- For missing required field: suggest a reasonable default value
- For invalid format: suggest the correct format
- For missing reference: suggest an existing valid reference
- For duplicate ID: suggest a unique ID
- For invalid JSON: suggest valid JSON structure

Respond with only the JSON object, no additional text.`;
}

function parseAIResponse(response: string): AIErrorFix {
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!parsed.suggestedValue || !parsed.explanation || typeof parsed.confidence !== 'number') {
      throw new Error('Invalid response structure from AI');
    }
    
    return {
      suggestedValue: String(parsed.suggestedValue),
      explanation: String(parsed.explanation),
      confidence: Math.max(0, Math.min(100, parsed.confidence))
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Raw response:', response);
    
    // Return a fallback response
    return {
      suggestedValue: '',
      explanation: 'Unable to parse AI response. Please fix manually.',
      confidence: 0
    };
  }
} 