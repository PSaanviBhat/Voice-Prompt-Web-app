const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-pro' });
}

// Mock AI responses for common patterns
function getMockAIResponse(command) {
  const lower = command.toLowerCase();
  
  // Table commands
  if (lower.includes('table')) {
    return {
      components: [{
        type: 'table',
        headers: ['Name', 'Email', 'Status'],
        rows: [
          ['John Doe', 'john@example.com', 'Active'],
          ['Jane Smith', 'jane@example.com', 'Active'],
          ['Bob Johnson', 'bob@example.com', 'Pending']
        ],
        striped: true
      }]
    };
  }
  
  // Form commands
  if (lower.includes('form') || lower.includes('contact') || lower.includes('feedback')) {
    const fields = [];
    
    // Detect what fields to include
    if (lower.includes('name')) {
      fields.push({ type: 'input', label: 'Name', inputType: 'text' });
    }
    if (lower.includes('email')) {
      fields.push({ type: 'input', label: 'Email', inputType: 'email' });
    }
    if (lower.includes('phone')) {
      fields.push({ type: 'input', label: 'Phone', inputType: 'tel' });
    }
    if (lower.includes('message') || lower.includes('comment')) {
      fields.push({ type: 'textarea', label: 'Message', rows: 4 });
    }
    if (lower.includes('dropdown') || lower.includes('select') || lower.includes('choose')) {
      fields.push({ 
        type: 'select', 
        label: 'Category', 
        options: ['Option 1', 'Option 2', 'Option 3'] 
      });
    }
    if (lower.includes('checkbox') || lower.includes('agree') || lower.includes('terms')) {
      fields.push({ type: 'checkbox', label: 'I agree to terms and conditions', checked: false });
    }
    if (lower.includes('radio') || lower.includes('option')) {
      fields.push({ 
        type: 'radio', 
        label: 'Select an option', 
        options: ['Option A', 'Option B', 'Option C'] 
      });
    }
    
    // Default form if no specific fields detected
    if (fields.length === 0) {
      fields.push(
        { type: 'input', label: 'Name', inputType: 'text' },
        { type: 'input', label: 'Email', inputType: 'email' },
        { type: 'textarea', label: 'Message', rows: 4 }
      );
    }
    
    return {
      components: [
        {
          type: 'heading',
          text: 'Contact Form',
          level: 2
        },
        ...fields,
        {
          type: 'button',
          text: 'Submit',
          color: 'primary'
        }
      ]
    };
  }
  
  // Login/Sign in forms
  if (lower.includes('login') || lower.includes('sign in')) {
    return {
      components: [{
        type: 'card',
        title: 'Login',
        content: 'Welcome back!',
        color: 'primary'
      }, {
        type: 'input',
        label: 'Email',
        inputType: 'email'
      }, {
        type: 'input',
        label: 'Password',
        inputType: 'password'
      }, {
        type: 'button',
        text: 'Sign In',
        color: 'primary'
      }]
    };
  }
  
  // Signup/Register forms
  if (lower.includes('signup') || lower.includes('sign up') || lower.includes('register')) {
    return {
      components: [{
        type: 'card',
        title: 'Create Account',
        content: 'Join us today!',
        color: 'success'
      }, {
        type: 'input',
        label: 'Name',
        inputType: 'text'
      }, {
        type: 'input',
        label: 'Email',
        inputType: 'email'
      }, {
        type: 'input',
        label: 'Password',
        inputType: 'password'
      }, {
        type: 'button',
        text: 'Register',
        color: 'success'
      }]
    };
  }
  
  // Dashboard
  if (lower.includes('dashboard')) {
    return {
      components: [{
        type: 'heading',
        text: 'Dashboard',
        level: 1
      }, {
        type: 'container',
        layout: 'grid',
        gap: 'md',
        children: [{
          type: 'card',
          title: 'Users',
          content: '1,234',
          color: 'primary'
        }, {
          type: 'card',
          title: 'Revenue',
          content: '$56,789',
          color: 'success'
        }, {
          type: 'card',
          title: 'Orders',
          content: '456',
          color: 'secondary'
        }]
      }]
    };
  }
  
  // Card
  if (lower.includes('card')) {
    return {
      components: [{
        type: 'card',
        title: 'Card Title',
        content: 'This is a card component with some content.',
        color: 'default'
      }]
    };
  }
  
  // List
  if (lower.includes('list')) {
    return {
      components: [{
        type: 'list',
        items: ['First item', 'Second item', 'Third item', 'Fourth item'],
        ordered: false
      }]
    };
  }
  
  // Default fallback
  return {
    components: [{
      type: 'container',
      layout: 'column',
      gap: 'md',
      children: [{
        type: 'heading',
        text: 'New Section',
        level: 2
      }, {
        type: 'text',
        content: 'Content created from your command.',
        size: 'md'
      }]
    }]
  };
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required and must be a string' });
    }

    let uiSchema;

    // Try AI if available
    if (model) {
      try {
        const prompt = `You are a UI builder assistant. Convert the following voice command into a JSON UI schema.

COMMAND: "${command}"

Return ONLY valid JSON with a components array. Use component types: container, input, button, text, table, card, list, heading, alert.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          uiSchema = JSON.parse(jsonMatch[0]);
        } else {
          uiSchema = getMockAIResponse(command);
        }
      } catch (error) {
        console.error('AI error:', error);
        uiSchema = getMockAIResponse(command);
      }
    } else {
      uiSchema = getMockAIResponse(command);
    }

    return res.status(200).json({
      success: true,
      uiState: {
        background: 'light',
        layout: 'column',
        spacing: 'normal',
        textAlign: 'left',
        textColor: 'default',
        borderStyle: 'none',
        shadow: 'none',
        padding: 'normal',
        fontSize: 'normal',
        animationSpeed: 'normal',
        borderRadius: 'normal',
        components: uiSchema.components || []
      },
      explanation: `Created UI from: "${command}"`
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
