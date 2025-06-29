# AI Features Setup Guide

## Smart Error Fixing with Gemini 2.0 Flash

This application now includes AI-powered error fixing that uses Google's Gemini 2.0 Flash model to suggest fixes for validation errors.

### Setup Instructions

1. **Get a Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Configure Environment Variable**
   Create a `.env.local` file in the root directory of your project with:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your-actual-api-key-here
   ```

3. **Restart the Development Server**
   After adding the environment variable, restart your Next.js development server:
   ```bash
   npm run dev
   ```

### How It Works

1. **Error Detection**: When validation finds errors, they appear in the Validation Summary
2. **AI Analysis**: Click "AI Fix" on any error to get AI-powered suggestions
3. **Smart Suggestions**: The AI analyzes the error context and suggests specific fixes
4. **Confidence Rating**: Each suggestion includes a confidence score (0-100%)
5. **One-Click Apply**: Apply the suggested fix with a single click

### Example Error Fixes

- **Missing Required Fields**: AI suggests reasonable default values
- **Invalid Formats**: AI suggests correct format (email, phone, JSON, etc.)
- **Missing References**: AI suggests existing valid references from your data
- **Duplicate IDs**: AI suggests unique IDs based on existing patterns
- **Invalid JSON**: AI suggests valid JSON structure

### API Request Format

The application makes requests to the Gemini API using this format:
```bash
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Your prompt here"
      }]
    }]
  }'
```

### Troubleshooting

- **API Key Not Found**: Ensure the environment variable is set correctly
- **Rate Limits**: The free tier has rate limits; consider upgrading for production use
- **Network Issues**: Check your internet connection and firewall settings

### Security Notes

- Never commit your API key to version control
- The API key is exposed to the client (NEXT_PUBLIC_ prefix) for demo purposes
- For production, consider using a backend proxy to protect your API key 