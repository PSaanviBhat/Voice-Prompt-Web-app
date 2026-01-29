# 🎤 Voice Architect UI

A voice-controlled UI builder that lets you design, modify, and persist UI layouts using natural language commands. Built for a hackathon with reliability and visual impact in mind.

![Voice Architect UI](https://img.shields.io/badge/Status-Demo%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 🎙️ Voice Control
- **Web Speech API Integration** - Real-time speech-to-text in the browser
- **Live Transcript Display** - See your commands as you speak
- **Visual Feedback** - Animated microphone button with breathing effect

### 🧠 Intelligent Command Processing
- **Simple Commands (Local)** - Instant UI changes handled in browser
  - Change background colors (dark, light, blue, green)
  - Switch layouts (column, grid)
  - Adjust spacing (compact, normal, large)
  - Reset UI
  
- **Complex Commands (AI-Powered)** - Natural language UI generation
  - "Create a login form"
  - "Design a signup form"
  - "Add a feedback card with button"
  - "Make a contact form"

### 🎨 Visual Design
- **Smooth CSS Transitions** - Fluid animations for all UI changes
- **Modern Component Library** - Pre-built, styled components
- **Responsive Layout** - Works on desktop and mobile
- **Multiple Themes** - Light, dark, blue, and green backgrounds

### 💾 Persistence
- **State Management** - UI state saved to backend
- **Auto-Restore** - Last UI state loads on refresh
- **Command History** - Track last 10 commands
- **Undo Functionality** - Revert changes with one click

### 🏗️ Component Schema
Predefined component types for reliable rendering:
- **Container** - Layout wrapper (column/row/grid)
- **Input** - Form inputs (text/email/password)
- **Button** - Action buttons (primary/secondary/danger)
- **Text** - Content text (sm/md/lg/xl sizes)

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- Modern browser (Chrome, Edge, or Safari recommended for best speech recognition)

### Installation

1. **Clone the repository**
   ```bash
   cd Voice-Prompt-Web-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example file
   copy .env.example .env
   
   # Edit .env and add your Gemini API key (optional)
   # Get your key from: https://makersuite.google.com/app/apikey
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```
   
   The backend will start on `http://localhost:3000`

5. **Open the frontend** (in a new terminal)
   ```bash
   cd ../frontend
   # Simply open index.html in your browser, or use a local server:
   npx serve .
   ```
   
   Or just double-click `frontend/index.html` to open in browser.

## 📖 Usage Guide

### Basic Workflow

1. **Click the microphone button** to start voice recognition
2. **Say a command** (see examples below)
3. **Watch the UI update** in real-time
4. **Use undo** to revert changes if needed
5. **Reset UI** to start fresh anytime

### Example Commands

#### Simple Commands (Instant)
```
"Dark background"
"Light background"
"Blue background"
"Green background"
"Grid layout"
"Column layout"
"More spacing"
"Less spacing"
"Reset UI"
```

#### Complex Commands (AI-Generated)
```
"Create a login form"
"Design a signup form with name, email and password"
"Add a feedback card with a submit button"
"Make a contact form"
"Build a newsletter signup"
```

### Keyboard Shortcuts
- **Space** - Toggle microphone
- **Ctrl+Z** - Undo last command

## 🏗️ Architecture

### Frontend (Vanilla JavaScript)
```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # Modern, animated styles
└── app.js              # Voice capture & UI rendering
```

**Key Features:**
- Web Speech API for voice input
- Rule-based parser for simple commands
- REST API client for complex commands
- Component rendering engine
- State management with undo stack

### Backend (Node.js + Express)
```
backend/
├── server.js           # Express server & API routes
├── package.json        # Dependencies
├── .env                # Configuration (create from .env.example)
└── ui-state.json       # Persisted UI state (auto-generated)
```

**Key Features:**
- RESTful API endpoints
- Gemini AI integration (with mock fallback)
- UI schema validation
- State persistence
- CORS enabled for local development

### API Endpoints

#### POST `/api/interpret-command`
Interprets complex voice commands using AI.

**Request:**
```json
{
  "command": "Create a login form"
}
```

**Response:**
```json
{
  "success": true,
  "uiState": {
    "background": "light",
    "layout": "column",
    "spacing": "normal",
    "components": [...]
  },
  "explanation": "Created 1 component(s)"
}
```

#### GET `/api/ui-state`
Returns the current UI state.

**Response:**
```json
{
  "background": "light",
  "layout": "column",
  "spacing": "normal",
  "components": []
}
```

#### POST `/api/save-ui`
Manually saves UI state.

**Request:**
```json
{
  "background": "dark",
  "layout": "grid",
  "spacing": "large",
  "components": []
}
```

#### POST `/api/reset-ui`
Resets UI to default state.

#### GET `/health`
Health check endpoint.

## 🤖 AI Integration

### Gemini API Setup (Optional)

The app works in **mock mode** without an API key, using predefined responses for common commands. For full AI capabilities:

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3000
   ```
3. Restart the backend server

### Mock Mode
Without an API key, the system uses intelligent pattern matching:
- "login" → Login form
- "signup" / "register" → Signup form
- "feedback" → Feedback form
- "contact" → Contact form
- Others → Generic welcome card

## 🎨 Customization

### Adding New Components

1. **Define the schema** in `backend/server.js`:
   ```javascript
   {
     type: "newComponent",
     // ...properties
   }
   ```

2. **Add validator** in `validateUISchema()`:
   ```javascript
   case 'newComponent':
     // validation logic
     return true;
   ```

3. **Create renderer** in `frontend/app.js`:
   ```javascript
   function createNewComponent(schema) {
     const element = document.createElement('div');
     // rendering logic
     return element;
   }
   ```

4. **Add styles** in `frontend/styles.css`:
   ```css
   .component-new {
     /* styles */
   }
   ```

### Theming

Modify CSS variables in `frontend/styles.css`:
```css
:root {
  --color-primary: #6366f1;
  --color-secondary: #ec4899;
  /* ... more variables */
}
```

## 🛡️ Security Notes

### For Hackathon Demo:
- ✅ API key stored in backend only
- ✅ Backend acts as AI proxy
- ✅ Schema validation prevents malicious UI
- ⚠️ No authentication (demo only)
- ⚠️ CORS open for localhost

### For Production:
Consider adding:
- User authentication
- Rate limiting
- Input sanitization
- CORS restrictions
- HTTPS enforcement

## 🐛 Troubleshooting

### Microphone Not Working
- **Check permissions**: Browser must have microphone access
- **Use HTTPS**: Some browsers require secure context for Web Speech API
- **Try Chrome/Edge**: Best speech recognition support

### Backend Connection Failed
- **Check server**: Ensure `npm start` is running in backend folder
- **Verify port**: Default is 3000, check if it's available
- **Check CORS**: Frontend and backend must allow each other

### AI Not Responding
- **Check API key**: Verify `.env` file has valid Gemini API key
- **Check logs**: Backend console shows AI status on startup
- **Mock mode works**: App functions without AI using pattern matching

## 📝 Known Limitations

- Speech recognition accuracy depends on browser and environment
- Web Speech API works best in Chrome/Edge
- AI responses may vary in quality
- No real form submission (demo UI only)
- Limited to predefined component types

## 🎯 Demo Script

Perfect 5-minute demo flow:

1. **Open app** - "Welcome to Voice Architect UI"
2. **Show simple commands** - "Dark background" → "Light background"
3. **Change layout** - "Grid layout"
4. **Create form** - "Create a login form"
5. **Show undo** - Click undo button
6. **Complex command** - "Design a signup form with name, email, and password"
7. **Show history** - Point out command history panel
8. **Adjust spacing** - "More spacing"
9. **Reset** - Click reset button

## 🤝 Contributing

This is a hackathon prototype. For improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use for your own projects!

## 🙏 Acknowledgments

- Web Speech API by browser vendors
- Gemini AI by Google
- Design inspiration from modern UI libraries
---

**Built by:** Hackathon Team  
- Sonia Sharma
- P Saanvi
- Rohini Vishu
