# Voice Architect UI - Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Create a Vercel account at https://vercel.com

## Deployment Steps

### 1. Initialize Git Repository (if not already done)
```bash
cd C:\Users\psaan\VoicePrompt\Voice-Prompt-Web-app
git init
git add .
git commit -m "Initial commit for Vercel deployment"
```

### 2. Install Dependencies
Make sure backend dependencies are installed:
```bash
cd backend
npm install
cd ..
```

### 3. Set Up Environment Variable
In your Vercel dashboard, you'll need to add the environment variable:
- Key: `GEMINI_API_KEY`
- Value: Your API key from `.env` file

### 4. Deploy to Vercel

**Option A: Deploy via CLI**
```bash
vercel
```
Follow the prompts:
- Set up and deploy? Yes
- Which scope? Your account
- Link to existing project? No
- Project name? voice-architect-ui
- In which directory is your code located? ./
- Auto-detected settings? Yes

**Option B: Deploy via GitHub**
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Add environment variable `GEMINI_API_KEY` in project settings
5. Click Deploy

### 5. Configure Environment Variable (CLI Method)
After first deployment:
```bash
vercel env add GEMINI_API_KEY
```
Enter your API key when prompted, select Production, and redeploy:
```bash
vercel --prod
```

## Project Structure for Vercel
```
Voice-Prompt-Web-app/
├── vercel.json          # Vercel configuration (created)
├── frontend/            # Static frontend files
│   ├── index.html
│   ├── app.js          # Updated with dynamic API URL
│   └── styles.css
├── backend/             # Backend API
│   ├── server.js
│   └── package.json
└── README.md
```

## Important Notes
1. **API URL**: Updated `app.js` to automatically use production URL when deployed
2. **Environment Variables**: Must be set in Vercel dashboard
3. **CORS**: Already configured in server.js to allow all origins
4. **Cold Starts**: First request may be slower (serverless function warmup)

## After Deployment
Your app will be available at: `https://your-project-name.vercel.app`

## Troubleshooting
- If API calls fail, check Vercel logs: `vercel logs`
- Verify environment variable is set in Vercel dashboard
- Check that CORS is properly configured in server.js
