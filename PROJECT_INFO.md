# Project Configuration

## Google Cloud Project Details

- **Project Name**: Interior Design AI
- **Project ID**: projects/967216824267
- **Project Number**: 967216824267

## API Configuration

### Gemini API Key
```
AIzaSyA0ql6Bz1fkNjBFOevAJoEBO6rQZix9w3k
```

**Location**: `.env.local` file (already configured)

### API Services Enabled

The following Google AI services should be enabled in your Google Cloud Console:
- ✅ Gemini API (AI Studio)
- ✅ Generative Language API

## Environment Variables

The app uses the following environment variable mapping:

**In `.env.local`:**
```bash
GEMINI_API_KEY=AIzaSyA0ql6Bz1fkNjBFOevAJoEBO6rQZix9w3k
```

**In `vite.config.ts`:**
```javascript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

## Models Used

This application uses the following Gemini models:

1. **gemini-2.5-flash**
   - Used for: Fast operations (furniture search, floor plan analysis)
   - Characteristics: Fast response times, cost-effective
   
2. **gemini-2.5-pro**
   - Used for: Complex reasoning (layout suggestions, auto-placement, design commands)
   - Characteristics: Advanced reasoning, multimodal capabilities

## API Quotas & Usage

Monitor your API usage at:
https://console.cloud.google.com/apis/api/generativeai.googleapis.com/quotas?project=967216824267

### Expected API Call Patterns

- **Furniture Search**: 1 API call per search query
- **Layout Suggestions**: 1 API call per suggestion request
- **Floor Plan Analysis**: 1 API call per image upload (vision model)
- **Auto-Design**: 1 API call per auto-design request
- **Design Commands**: 1 API call per natural language command
- **Layout Validation**: 1 API call every 1.5 seconds after furniture placement (debounced)

## Security Notes

⚠️ **Important**: 
- The `.env.local` file is gitignored to keep your API key secure
- Never commit `.env.local` to version control
- For production deployment, use environment variables on your hosting platform
- Consider using API key restrictions in Google Cloud Console:
  - Restrict to specific domains (for web deployment)
  - Set usage quotas to prevent unexpected costs

## Deployment Considerations

When deploying to production:

1. **Environment Variables**: Set `GEMINI_API_KEY` in your hosting platform's environment configuration
2. **API Key Restrictions**: Configure in Google Cloud Console
3. **Domain Restrictions**: Limit API key usage to your production domain
4. **Rate Limiting**: Consider implementing client-side rate limiting for API calls
5. **Error Monitoring**: Set up logging for API failures

## Troubleshooting

### If APIs are not working:

1. **Check API Key**: Verify the key in `.env.local` matches your Google Cloud Console
2. **Enable APIs**: Ensure Gemini API is enabled for project 967216824267
3. **Check Quotas**: Verify you haven't exceeded quota limits
4. **Browser Console**: Check for CORS or network errors
5. **Server Logs**: Look for API error messages in the terminal

### Common Issues:

- **401 Unauthorized**: API key is invalid or not set
- **403 Forbidden**: API not enabled or quota exceeded
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Error**: Gemini service issue (retry)

## Support Resources

- Google AI Studio: https://ai.google.dev/
- API Documentation: https://ai.google.dev/docs
- Cloud Console: https://console.cloud.google.com/home/dashboard?project=967216824267
- API Keys: https://console.cloud.google.com/apis/credentials?project=967216824267

