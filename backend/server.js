/**
 * Voice Architect UI - Backend Server
 * Handles AI interpretation of voice commands and UI state persistence
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI (with error handling for missing key)
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyArrEM7poiqAxQFDZwMw1UCPt5blWhBaCs') {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
  }
} else {
  console.warn('⚠️  No Gemini API key found. Using mock responses for demo.');
}

// In-memory UI state storage (can be persisted to file)
let currentUIState = {
  background: 'light',
  layout: 'column',
  spacing: 'normal',
  textAlign: 'left',
  textColor: 'default',
  borderStyle: 'none',
  shadow: 'none',
  padding: 'normal',
  components: []
};

// File path for persistence
const UI_STATE_FILE = path.join(__dirname, 'ui-state.json');

/**
 * Load UI state from file on startup
 */
async function loadUIState() {
  try {
    const data = await fs.readFile(UI_STATE_FILE, 'utf-8');
    currentUIState = JSON.parse(data);
    console.log('✅ Loaded previous UI state');
  } catch (error) {
    console.log('ℹ️  No previous UI state found, using defaults');
  }
}

/**
 * Save UI state to file
 */
async function saveUIState() {
  try {
    await fs.writeFile(UI_STATE_FILE, JSON.stringify(currentUIState, null, 2));
    console.log('💾 UI state saved');
  } catch (error) {
    console.error('❌ Failed to save UI state:', error.message);
  }
}

/**
 * Generate AI prompt for UI interpretation
 */
function createAIPrompt(command) {
  return `You are a UI builder assistant. Convert the following voice command into a JSON UI schema.

COMMAND: "${command}"

RULES:
1. Return ONLY valid JSON, no explanatory text
2. Use only these component types: container, input, button, text, table, card, list, image, badge, alert, heading, divider, link
3. Container has: type, layout (column/row/grid), gap (sm/md/lg), children array
4. Input has: type, label, inputType (text/email/password/number/date)
5. Button has: type, text, color (primary/secondary/danger/success)
6. Text has: type, content, size (sm/md/lg/xl)
7. Table has: type, headers (array), rows (array of arrays)
8. Card has: type, title, content, footer (optional), color (default/primary/secondary)
9. List has: type, items (array), ordered (boolean)
10. Image has: type, src (url or placeholder), alt, size (sm/md/lg/full)
11. Badge has: type, text, color (primary/secondary/success/danger/warning)
12. Alert has: type, message, alertType (info/success/warning/danger)
13. Heading has: type, text, level (1-6)
14. Divider has: type, style (solid/dashed/dotted)
15. Link has: type, text, href, external (boolean)

EXAMPLES:

Command: "Create a login form"
Output:
{
  "components": [
    {
      "type": "container",
      "layout": "column",
      "gap": "md",
      "children": [
        {"type": "text", "content": "Login", "size": "xl"},
        {"type": "input", "label": "Email", "inputType": "email"},
        {"type": "input", "label": "Password", "inputType": "password"},
        {"type": "button", "text": "Sign In", "color": "primary"}
      ]
    }
  ]
}

Command: "Design a signup form"
Output:
{
  "components": [
    {
      "type": "container",
      "layout": "column",
      "gap": "md",
      "children": [
        {"type": "text", "content": "Create Account", "size": "xl"},
        {"type": "input", "label": "Full Name", "inputType": "text"},
        {"type": "input", "label": "Email", "inputType": "email"},
        {"type": "input", "label": "Password", "inputType": "password"},
        {"type": "input", "label": "Confirm Password", "inputType": "password"},
        {"type": "button", "text": "Register", "color": "primary"}
      ]
    }
  ]
}

Now convert the command above into JSON schema:`;
}

/**
 * Mock AI response for demo purposes
 */
function getMockAIResponse(command) {
  const lowerCommand = command.toLowerCase();
  
  // Login form
  if (lowerCommand.includes('login')) {
    return {
      components: [
        {
          type: "container",
          layout: "column",
          gap: "md",
          children: [
            { type: "text", content: "Login", size: "xl" },
            { type: "input", label: "Email", inputType: "email" },
            { type: "input", label: "Password", inputType: "password" },
            { type: "button", text: "Sign In", color: "primary" }
          ]
        }
      ]
    };
  }
  
  // Signup form
  if (lowerCommand.includes('signup') || lowerCommand.includes('sign up') || lowerCommand.includes('register')) {
    return {
      components: [
        {
          type: "container",
          layout: "column",
          gap: "md",
          children: [
            { type: "text", content: "Create Account", size: "xl" },
            { type: "input", label: "Full Name", inputType: "text" },
            { type: "input", label: "Email", inputType: "email" },
            { type: "input", label: "Password", inputType: "password" },
            { type: "button", text: "Register", color: "primary" }
          ]
        }
      ]
    };
  }
  
  // Feedback card
  if (lowerCommand.includes('feedback')) {
    return {
      components: [
        {
          type: "container",
          layout: "column",
          gap: "md",
          children: [
            { type: "text", content: "We'd Love Your Feedback", size: "xl" },
            { type: "input", label: "Your Name", inputType: "text" },
            { type: "input", label: "Email", inputType: "email" },
            { type: "input", label: "Message", inputType: "text" },
            { type: "button", text: "Submit Feedback", color: "primary" }
          ]
        }
      ]
    };
  }
  
  // Contact form
  if (lowerCommand.includes('contact')) {
    return {
      components: [
        {
          type: "container",
          layout: "column",
          gap: "md",
          children: [
            { type: "text", content: "Contact Us", size: "xl" },
            { type: "input", label: "Name", inputType: "text" },
            { type: "input", label: "Email", inputType: "email" },
            { type: "input", label: "Subject", inputType: "text" },
            { type: "button", text: "Send Message", color: "primary" }
          ]
        }
      ]
    };
  }
  
  // Table
  if (lowerCommand.includes('table') || lowerCommand.includes('data table') || lowerCommand.includes('student') || lowerCommand.includes('marks')) {
    return {
      components: [
        {
          type: "table",
          headers: ["Name", "Subject", "Marks", "Grade"],
          rows: [
            ["Alice Johnson", "Mathematics", "95", "A"],
            ["Bob Smith", "Physics", "88", "B+"],
            ["Carol Davis", "Chemistry", "92", "A-"],
            ["David Wilson", "Biology", "85", "B"]
          ]
        }
      ]
    };
  }
  
  // Card
  if (lowerCommand.includes('card') || lowerCommand.includes('profile')) {
    return {
      components: [
        {
          type: "card",
          title: "User Profile",
          content: "Welcome to your dashboard. Here you can manage your account settings and preferences.",
          footer: "Last updated: Today",
          color: "primary"
        }
      ]
    };
  }
  
  // List
  if (lowerCommand.includes('list') || lowerCommand.includes('items')) {
    return {
      components: [
        {
          type: "heading",
          text: "Features List",
          level: 2
        },
        {
          type: "list",
          items: ["Voice-controlled interface", "Real-time updates", "Responsive design", "Modern UI components"],
          ordered: false
        }
      ]
    };
  }
  
  // Alert
  if (lowerCommand.includes('alert') || lowerCommand.includes('notification')) {
    return {
      components: [
        {
          type: "alert",
          message: "This is an important notification. Please review the information below.",
          alertType: "info"
        }
      ]
    };
  }
  
  // Badge
  if (lowerCommand.includes('badge') || lowerCommand.includes('tag')) {
    return {
      components: [
        {
          type: "container",
          layout: "row",
          gap: "sm",
          children: [
            { type: "badge", text: "New", color: "success" },
            { type: "badge", text: "Popular", color: "primary" },
            { type: "badge", text: "Hot", color: "danger" }
          ]
        }
      ]
    };
  }
  
  // Dashboard
  if (lowerCommand.includes('dashboard')) {
    return {
      components: [
        {
          type: "heading",
          text: "Dashboard",
          level: 1
        },
        {
          type: "container",
          layout: "grid",
          gap: "lg",
          children: [
            { type: "card", title: "Total Users", content: "1,234", color: "primary" },
            { type: "card", title: "Revenue", content: "$45,678", color: "success" },
            { type: "card", title: "Active Sessions", content: "89", color: "secondary" }
          ]
        }
      ]
    };
  }
  
  // Generic card
  return {
    components: [
      {
        type: "container",
        layout: "column",
        gap: "md",
        children: [
          { type: "text", content: "Welcome", size: "xl" },
          { type: "text", content: "Your custom UI has been created", size: "md" },
          { type: "button", text: "Get Started", color: "primary" }
        ]
      }
    ]
  };
}

/**
 * Validate and sanitize AI output
 */
function validateUISchema(schema) {
  const validTypes = ['container', 'input', 'button', 'text', 'table', 'card', 'list', 'image', 'badge', 'alert', 'heading', 'divider', 'link'];
  const validLayouts = ['column', 'row', 'grid'];
  const validGaps = ['sm', 'md', 'lg'];
  const validInputTypes = ['text', 'email', 'password', 'number', 'date'];
  const validColors = ['primary', 'secondary', 'danger', 'success', 'warning', 'default'];
  const validSizes = ['sm', 'md', 'lg', 'xl', 'full'];
  const validAlertTypes = ['info', 'success', 'warning', 'danger'];
  const validDividerStyles = ['solid', 'dashed', 'dotted'];
  
  function validateComponent(component) {
    if (!component.type || !validTypes.includes(component.type)) {
      return false;
    }
    
    switch (component.type) {
      case 'container':
        if (!validLayouts.includes(component.layout)) return false;
        if (component.gap && !validGaps.includes(component.gap)) return false;
        if (!Array.isArray(component.children)) return false;
        return component.children.every(validateComponent);
      
      case 'input':
        if (!component.label || typeof component.label !== 'string') return false;
        if (!validInputTypes.includes(component.inputType)) return false;
        return true;
      
      case 'button':
        if (!component.text || typeof component.text !== 'string') return false;
        if (!validColors.includes(component.color)) return false;
        return true;
      
      case 'text':
        if (!component.content || typeof component.content !== 'string') return false;
        if (!validSizes.includes(component.size)) return false;
        return true;
      
      case 'table':
        if (!Array.isArray(component.headers)) return false;
        if (!Array.isArray(component.rows)) return false;
        return true;
      
      case 'card':
        if (!component.title || typeof component.title !== 'string') return false;
        if (!component.content || typeof component.content !== 'string') return false;
        if (component.color && !validColors.includes(component.color)) return false;
        return true;
      
      case 'list':
        if (!Array.isArray(component.items)) return false;
        if (typeof component.ordered !== 'boolean') return false;
        return true;
      
      case 'image':
        if (!component.src || typeof component.src !== 'string') return false;
        if (!component.alt || typeof component.alt !== 'string') return false;
        if (component.size && !validSizes.includes(component.size)) return false;
        return true;
      
      case 'badge':
        if (!component.text || typeof component.text !== 'string') return false;
        if (!validColors.includes(component.color)) return false;
        return true;
      
      case 'alert':
        if (!component.message || typeof component.message !== 'string') return false;
        if (!validAlertTypes.includes(component.alertType)) return false;
        return true;
      
      case 'heading':
        if (!component.text || typeof component.text !== 'string') return false;
        if (!component.level || component.level < 1 || component.level > 6) return false;
        return true;
      
      case 'divider':
        if (component.style && !validDividerStyles.includes(component.style)) return false;
        return true;
      
      case 'link':
        if (!component.text || typeof component.text !== 'string') return false;
        if (!component.href || typeof component.href !== 'string') return false;
        return true;
      
      default:
        return false;
    }
  }
  
  if (!schema.components || !Array.isArray(schema.components)) {
    return false;
  }
  
  return schema.components.every(validateComponent);
}

// API Routes

/**
 * POST /api/interpret-command
 * Interprets complex voice commands using AI
 */
app.post('/api/interpret-command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Invalid command' });
    }
    
    console.log(`🎤 Interpreting command: "${command}"`);
    
    let uiSchema;
    
    // Try AI interpretation first
    if (model) {
      try {
        const prompt = createAIPrompt(command);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from response (AI might add explanation)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          uiSchema = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (aiError) {
        console.warn('⚠️  AI interpretation failed, using mock:', aiError.message);
        uiSchema = getMockAIResponse(command);
      }
    } else {
      // Use mock response
      uiSchema = getMockAIResponse(command);
    }
    
    // Validate schema
    if (!validateUISchema(uiSchema)) {
      console.error('❌ Invalid UI schema generated');
      return res.status(500).json({ error: 'Generated invalid UI schema' });
    }
    
    // Update current state with new components
    currentUIState.components = uiSchema.components;
    
    // Save state
    await saveUIState();
    
    console.log('✅ Command interpreted successfully');
    res.json({
      success: true,
      uiState: currentUIState,
      explanation: `Created ${uiSchema.components.length} component(s)`
    });
    
  } catch (error) {
    console.error('❌ Error interpreting command:', error);
    res.status(500).json({ error: 'Failed to interpret command' });
  }
});

/**
 * GET /api/ui-state
 * Returns current UI state
 */
app.get('/api/ui-state', (req, res) => {
  res.json(currentUIState);
});

/**
 * POST /api/save-ui
 * Saves UI state (supports manual updates)
 */
app.post('/api/save-ui', async (req, res) => {
  try {
    const { background, layout, spacing, textAlign, textColor, borderStyle, shadow, padding, components } = req.body;
    
    // Update state
    if (background) currentUIState.background = background;
    if (layout) currentUIState.layout = layout;
    if (spacing) currentUIState.spacing = spacing;
    if (textAlign) currentUIState.textAlign = textAlign;
    if (textColor) currentUIState.textColor = textColor;
    if (borderStyle) currentUIState.borderStyle = borderStyle;
    if (shadow) currentUIState.shadow = shadow;
    if (padding) currentUIState.padding = padding;
    if (components) currentUIState.components = components;
    
    // Persist to file
    await saveUIState();
    
    res.json({ success: true, uiState: currentUIState });
  } catch (error) {
    console.error('❌ Error saving UI state:', error);
    res.status(500).json({ error: 'Failed to save UI state' });
  }
});

/**
 * POST /api/reset-ui
 * Resets UI to default state
 */
app.post('/api/reset-ui', async (req, res) => {
  currentUIState = {
    background: 'light',
    layout: 'column',
    spacing: 'normal',
    textAlign: 'left',
    textColor: 'default',
    borderStyle: 'none',
    shadow: 'none',
    padding: 'normal',
    components: []
  };
  
  await saveUIState();
  
  res.json({ success: true, uiState: currentUIState });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    aiEnabled: model !== null,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  await loadUIState();
  
  app.listen(PORT, () => {
    console.log('\n🚀 Voice Architect UI Backend');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🤖 AI Status: ${model ? 'Enabled' : 'Mock Mode'}`);
    console.log('\nAPI Endpoints:');
    console.log(`  POST http://localhost:${PORT}/api/interpret-command`);
    console.log(`  GET  http://localhost:${PORT}/api/ui-state`);
    console.log(`  POST http://localhost:${PORT}/api/save-ui`);
    console.log(`  POST http://localhost:${PORT}/api/reset-ui`);
    console.log(`  GET  http://localhost:${PORT}/health\n`);
  });
}

startServer();
