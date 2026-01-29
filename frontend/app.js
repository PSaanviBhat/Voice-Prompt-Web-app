/**
 * Voice Architect UI - Frontend Application
 * Handles voice input, command processing, and UI rendering
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Application State
const state = {
  isListening: false,
  recognition: null,
  currentTranscript: '',
  uiState: {
    background: 'light',
    layout: 'column',
    spacing: 'normal',
    textAlign: 'left',
    textColor: 'default',
    borderStyle: 'none',
    shadow: 'none',
    padding: 'normal',
    components: []
  },
  commandHistory: [],
  historyStack: []
};

// DOM Elements
const elements = {
  micButton: document.getElementById('micButton'),
  micIcon: document.getElementById('micIcon'),
  micStatus: document.getElementById('micStatus'),
  transcript: document.getElementById('transcript'),
  listeningIndicator: document.getElementById('listeningIndicator'),
  uiContainer: document.getElementById('uiContainer'),
  canvasArea: document.getElementById('canvasArea'),
  historyList: document.getElementById('historyList'),
  undoBtn: document.getElementById('undoBtn'),
  resetBtn: document.getElementById('resetBtn'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  processingOverlay: document.getElementById('processingOverlay'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText')
};

/**
 * Initialize application
 */
async function init() {
  console.log('🚀 Initializing Voice Architect UI...');
  
  // Check API connection
  await checkAPIConnection();
  
  // Initialize Speech Recognition
  initSpeechRecognition();
  
  // Load saved UI state
  await loadUIState();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('✅ Application ready');
}

/**
 * Check backend API connection
 */
async function checkAPIConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    elements.statusDot.className = 'status-dot connected';
    elements.statusText.textContent = data.aiEnabled ? 'AI Enabled' : 'Mock Mode';
    
    console.log('✅ Connected to backend');
  } catch (error) {
    elements.statusDot.className = 'status-dot disconnected';
    elements.statusText.textContent = 'Backend Offline';
    
    console.error('❌ Backend connection failed:', error);
    showToast('⚠️ Backend is offline. Start the server first.', 'error');
  }
}

/**
 * Initialize Web Speech API
 */
function initSpeechRecognition() {
  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('❌ Speech Recognition not supported');
    elements.micButton.disabled = true;
    elements.micStatus.textContent = 'Not Supported';
    showToast('Speech Recognition is not supported in this browser', 'error');
    return;
  }
  
  // Create recognition instance
  state.recognition = new SpeechRecognition();
  state.recognition.continuous = true;
  state.recognition.interimResults = true;
  state.recognition.lang = 'en-US';
  
  // Event handlers
  state.recognition.onstart = () => {
    console.log('🎤 Listening started');
    state.isListening = true;
    updateMicrophoneUI();
  };
  
  state.recognition.onend = () => {
    console.log('🎤 Listening stopped');
    state.isListening = false;
    updateMicrophoneUI();
  };
  
  state.recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Update transcript display
    state.currentTranscript = finalTranscript || interimTranscript;
    elements.transcript.textContent = state.currentTranscript || 'Listening...';
    
    // Process final transcript
    if (finalTranscript.trim()) {
      processCommand(finalTranscript.trim());
    }
  };
  
  state.recognition.onerror = (event) => {
    console.error('❌ Speech recognition error:', event.error);
    
    if (event.error === 'no-speech') {
      showToast('No speech detected. Try again.', 'warning');
    } else if (event.error === 'not-allowed') {
      showToast('Microphone access denied', 'error');
      elements.micButton.disabled = true;
    } else {
      showToast(`Speech error: ${event.error}`, 'error');
    }
  };
  
  console.log('✅ Speech Recognition initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Microphone button
  elements.micButton.addEventListener('click', toggleListening);
  
  // Undo button
  elements.undoBtn.addEventListener('click', undoLastCommand);
  
  // Reset button
  elements.resetBtn.addEventListener('click', resetUI);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Space to toggle mic
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      toggleListening();
    }
    
    // Ctrl+Z to undo
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undoLastCommand();
    }
  });
}

/**
 * Toggle microphone listening
 */
function toggleListening() {
  if (!state.recognition) return;
  
  if (state.isListening) {
    state.recognition.stop();
  } else {
    state.recognition.start();
    elements.transcript.textContent = 'Listening...';
  }
}

/**
 * Update microphone button UI
 */
function updateMicrophoneUI() {
  if (state.isListening) {
    elements.micButton.classList.add('listening');
    elements.micStatus.textContent = 'Listening...';
    elements.listeningIndicator.classList.add('active');
  } else {
    elements.micButton.classList.remove('listening');
    elements.micStatus.textContent = 'Click to Start';
    elements.listeningIndicator.classList.remove('active');
  }
}

/**
 * Process voice command
 */
async function processCommand(command) {
  console.log(`🎤 Processing: "${command}"`);
  
  // Add to history
  addToHistory(command);
  
  // Save current state for undo
  state.historyStack.push(JSON.parse(JSON.stringify(state.uiState)));
  elements.undoBtn.disabled = false;
  
  // Check if it's a simple command (handle locally)
  const simpleCommand = trySimpleCommand(command);
  
  if (simpleCommand) {
    // Local processing
    console.log('✅ Handled locally');
    await saveUIState();
    showToast(`✓ ${simpleCommand}`, 'success');
  } else {
    // Complex command - send to backend
    await sendToBackend(command);
  }
}

/**
 * Try to handle simple commands locally
 */
function trySimpleCommand(command) {
  const lower = command.toLowerCase();
  
  // Background color
  if (lower.includes('dark') && lower.includes('background')) {
    state.uiState.background = 'dark';
    applyUIState();
    return 'Changed to dark background';
  }
  if (lower.includes('light') && lower.includes('background')) {
    state.uiState.background = 'light';
    applyUIState();
    return 'Changed to light background';
  }
  if (lower.includes('blue') && lower.includes('background')) {
    state.uiState.background = 'blue';
    applyUIState();
    return 'Changed to blue background';
  }
  if (lower.includes('green') && lower.includes('background')) {
    state.uiState.background = 'green';
    applyUIState();
    return 'Changed to green background';
  }
  
  // Layout
  if (lower.includes('grid') && lower.includes('layout')) {
    state.uiState.layout = 'grid';
    applyUIState();
    return 'Switched to grid layout';
  }
  if (lower.includes('column') && lower.includes('layout')) {
    state.uiState.layout = 'column';
    applyUIState();
    return 'Switched to column layout';
  }
  
  // Spacing
  if (lower.includes('more') && lower.includes('spacing')) {
    state.uiState.spacing = 'large';
    applyUIState();
    return 'Increased spacing';
  }
  if (lower.includes('less') && lower.includes('spacing')) {
    state.uiState.spacing = 'compact';
    applyUIState();
    return 'Reduced spacing';
  }
  if (lower.includes('normal') && lower.includes('spacing')) {
    state.uiState.spacing = 'normal';
    applyUIState();
    return 'Reset to normal spacing';
  }
  
  // Text alignment
  if (lower.includes('center') && (lower.includes('text') || lower.includes('align'))) {
    state.uiState.textAlign = 'center';
    applyUIState();
    return 'Centered text';
  }
  if (lower.includes('left') && (lower.includes('text') || lower.includes('align'))) {
    state.uiState.textAlign = 'left';
    applyUIState();
    return 'Aligned text left';
  }
  if (lower.includes('right') && (lower.includes('text') || lower.includes('align'))) {
    state.uiState.textAlign = 'right';
    applyUIState();
    return 'Aligned text right';
  }
  
  // Text color
  if (lower.includes('red') && lower.includes('text')) {
    state.uiState.textColor = 'red';
    applyUIState();
    return 'Changed text to red';
  }
  if (lower.includes('blue') && lower.includes('text')) {
    state.uiState.textColor = 'blue';
    applyUIState();
    return 'Changed text to blue';
  }
  if (lower.includes('green') && lower.includes('text')) {
    state.uiState.textColor = 'green';
    applyUIState();
    return 'Changed text to green';
  }
  if (lower.includes('white') && lower.includes('text')) {
    state.uiState.textColor = 'white';
    applyUIState();
    return 'Changed text to white';
  }
  if (lower.includes('default') && lower.includes('text')) {
    state.uiState.textColor = 'default';
    applyUIState();
    return 'Reset text color';
  }
  
  // Border style
  if (lower.includes('add') && lower.includes('border')) {
    state.uiState.borderStyle = 'solid';
    applyUIState();
    return 'Added borders';
  }
  if (lower.includes('remove') && lower.includes('border')) {
    state.uiState.borderStyle = 'none';
    applyUIState();
    return 'Removed borders';
  }
  if (lower.includes('dashed') && lower.includes('border')) {
    state.uiState.borderStyle = 'dashed';
    applyUIState();
    return 'Changed to dashed borders';
  }
  
  // Shadow
  if (lower.includes('add') && lower.includes('shadow')) {
    state.uiState.shadow = 'large';
    applyUIState();
    return 'Added shadow effects';
  }
  if (lower.includes('remove') && lower.includes('shadow')) {
    state.uiState.shadow = 'none';
    applyUIState();
    return 'Removed shadows';
  }
  if (lower.includes('small') && lower.includes('shadow')) {
    state.uiState.shadow = 'small';
    applyUIState();
    return 'Applied small shadows';
  }
  
  // Padding
  if (lower.includes('more') && lower.includes('padding')) {
    state.uiState.padding = 'large';
    applyUIState();
    return 'Increased padding';
  }
  if (lower.includes('less') && lower.includes('padding')) {
    state.uiState.padding = 'compact';
    applyUIState();
    return 'Reduced padding';
  }
  if (lower.includes('normal') && lower.includes('padding')) {
    state.uiState.padding = 'normal';
    applyUIState();
    return 'Reset to normal spacing';
  }
  
  // Reset
  if (lower.includes('reset') && lower.includes('ui')) {
    resetUI();
    return 'UI reset';
  }
  
  return null; // Not a simple command
}

/**
 * Send complex command to backend
 */
async function sendToBackend(command) {
  showProcessing(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/interpret-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    
    if (!response.ok) {
      throw new Error('Backend request failed');
    }
    
    const data = await response.json();
    
    if (data.success) {
      state.uiState = data.uiState;
      applyUIState();
      showToast(`✓ ${data.explanation || 'UI updated'}`, 'success');
      console.log('✅ Backend processing successful');
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Backend error:', error);
    showToast('Failed to process command', 'error');
    
    // Revert state
    state.historyStack.pop();
    if (state.historyStack.length === 0) {
      elements.undoBtn.disabled = true;
    }
  } finally {
    showProcessing(false);
  }
}

/**
 * Apply current UI state to the canvas
 */
function applyUIState() {
  // Apply background
  elements.canvasArea.setAttribute('data-background', state.uiState.background);
  
  // Apply layout
  elements.uiContainer.setAttribute('data-layout', state.uiState.layout);
  
  // Apply spacing
  elements.uiContainer.setAttribute('data-spacing', state.uiState.spacing);
  
  // Apply text alignment
  elements.uiContainer.setAttribute('data-text-align', state.uiState.textAlign);
  
  // Apply text color
  elements.uiContainer.setAttribute('data-text-color', state.uiState.textColor);
  
  // Apply border style
  elements.uiContainer.setAttribute('data-border-style', state.uiState.borderStyle);
  
  // Apply shadow
  elements.uiContainer.setAttribute('data-shadow', state.uiState.shadow);
  
  // Apply padding
  elements.uiContainer.setAttribute('data-padding', state.uiState.padding);
  
  // Render components
  renderComponents(state.uiState.components);
}

/**
 * Render UI components from schema
 */
function renderComponents(components) {
  if (!components || components.length === 0) {
    elements.uiContainer.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
        <h3>Start with Your Voice</h3>
        <p>Click the microphone and say a command to build your UI</p>
      </div>
    `;
    return;
  }
  
  elements.uiContainer.innerHTML = '';
  
  components.forEach(component => {
    const element = createComponent(component);
    if (element) {
      elements.uiContainer.appendChild(element);
    }
  });
}

/**
 * Create a UI component from schema
 */
function createComponent(schema) {
  switch (schema.type) {
    case 'container':
      return createContainer(schema);
    case 'input':
      return createInput(schema);
    case 'button':
      return createButton(schema);
    case 'text':
      return createText(schema);
    case 'table':
      return createTable(schema);
    case 'card':
      return createCard(schema);
    case 'list':
      return createList(schema);
    case 'image':
      return createImage(schema);
    case 'badge':
      return createBadge(schema);
    case 'alert':
      return createAlert(schema);
    case 'heading':
      return createHeading(schema);
    case 'divider':
      return createDivider(schema);
    case 'link':
      return createLink(schema);
    default:
      console.warn('Unknown component type:', schema.type);
      return null;
  }
}

/**
 * Create container component
 */
function createContainer(schema) {
  const container = document.createElement('div');
  container.className = 'component-container';
  container.setAttribute('data-layout', schema.layout || 'column');
  container.setAttribute('data-gap', schema.gap || 'md');
  
  if (schema.children && Array.isArray(schema.children)) {
    schema.children.forEach(child => {
      const childElement = createComponent(child);
      if (childElement) {
        container.appendChild(childElement);
      }
    });
  }
  
  return container;
}

/**
 * Create input component
 */
function createInput(schema) {
  const wrapper = document.createElement('div');
  wrapper.className = 'component-input-wrapper';
  
  const label = document.createElement('label');
  label.className = 'component-label';
  label.textContent = schema.label || 'Input';
  
  const input = document.createElement('input');
  input.className = 'component-input';
  input.type = schema.inputType || 'text';
  input.placeholder = schema.label || '';
  
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  
  return wrapper;
}

/**
 * Create button component
 */
function createButton(schema) {
  const button = document.createElement('button');
  button.className = 'component-button';
  button.setAttribute('data-color', schema.color || 'primary');
  button.textContent = schema.text || 'Button';
  
  return button;
}

/**
 * Create text component
 */
function createText(schema) {
  const text = document.createElement('div');
  text.className = 'component-text';
  text.setAttribute('data-size', schema.size || 'md');
  text.textContent = schema.content || '';
  
  return text;
}

/**
 * Create table component
 */
function createTable(schema) {
  const table = document.createElement('table');
  table.className = 'component-table';
  
  // Create header
  if (schema.headers && schema.headers.length > 0) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    schema.headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
  }
  
  // Create body
  if (schema.rows && schema.rows.length > 0) {
    const tbody = document.createElement('tbody');
    
    schema.rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
  }
  
  return table;
}

/**
 * Create card component
 */
function createCard(schema) {
  const card = document.createElement('div');
  card.className = 'component-card';
  card.setAttribute('data-color', schema.color || 'default');
  
  if (schema.title) {
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = schema.title;
    card.appendChild(title);
  }
  
  if (schema.content) {
    const content = document.createElement('div');
    content.className = 'card-content';
    content.textContent = schema.content;
    card.appendChild(content);
  }
  
  if (schema.footer) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    footer.textContent = schema.footer;
    card.appendChild(footer);
  }
  
  return card;
}

/**
 * Create list component
 */
function createList(schema) {
  const list = document.createElement(schema.ordered ? 'ol' : 'ul');
  list.className = 'component-list';
  
  if (schema.items && Array.isArray(schema.items)) {
    schema.items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  }
  
  return list;
}

/**
 * Create image component
 */
function createImage(schema) {
  const wrapper = document.createElement('div');
  wrapper.className = 'component-image-wrapper';
  wrapper.setAttribute('data-size', schema.size || 'md');
  
  const img = document.createElement('div');
  img.className = 'component-image';
  img.textContent = '🖼️ ' + (schema.alt || 'Image placeholder');
  
  wrapper.appendChild(img);
  
  return wrapper;
}

/**
 * Create badge component
 */
function createBadge(schema) {
  const badge = document.createElement('span');
  badge.className = 'component-badge';
  badge.setAttribute('data-color', schema.color || 'primary');
  badge.textContent = schema.text || 'Badge';
  
  return badge;
}

/**
 * Create alert component
 */
function createAlert(schema) {
  const alert = document.createElement('div');
  alert.className = 'component-alert';
  alert.setAttribute('data-type', schema.alertType || 'info');
  
  const icon = document.createElement('span');
  icon.className = 'alert-icon';
  icon.textContent = getAlertIcon(schema.alertType);
  
  const message = document.createElement('span');
  message.className = 'alert-message';
  message.textContent = schema.message || 'Alert message';
  
  alert.appendChild(icon);
  alert.appendChild(message);
  
  return alert;
}

/**
 * Create heading component
 */
function createHeading(schema) {
  const level = Math.min(Math.max(schema.level || 2, 1), 6);
  const heading = document.createElement(`h${level}`);
  heading.className = 'component-heading';
  heading.textContent = schema.text || 'Heading';
  
  return heading;
}

/**
 * Create divider component
 */
function createDivider(schema) {
  const divider = document.createElement('hr');
  divider.className = 'component-divider';
  divider.setAttribute('data-style', schema.style || 'solid');
  
  return divider;
}

/**
 * Create link component
 */
function createLink(schema) {
  const link = document.createElement('a');
  link.className = 'component-link';
  link.href = schema.href || '#';
  link.textContent = schema.text || 'Link';
  
  if (schema.external) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  
  return link;
}

/**
 * Get alert icon by type
 */
function getAlertIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'warning': return '⚠';
    case 'danger': return '✕';
    default: return 'ℹ';
  }
}

/**
 * Add command to history
 */
function addToHistory(command) {
  state.commandHistory.unshift({
    command,
    timestamp: new Date()
  });
  
  // Keep only last 10 commands
  if (state.commandHistory.length > 10) {
    state.commandHistory.pop();
  }
  
  updateHistoryDisplay();
}

/**
 * Update history display
 */
function updateHistoryDisplay() {
  if (state.commandHistory.length === 0) {
    elements.historyList.innerHTML = '<div class="history-empty">No commands yet</div>';
    return;
  }
  
  elements.historyList.innerHTML = state.commandHistory
    .map(item => `
      <div class="history-item">
        <div class="history-command">${escapeHtml(item.command)}</div>
        <div class="history-time">${formatTime(item.timestamp)}</div>
      </div>
    `)
    .join('');
}

/**
 * Undo last command
 */
function undoLastCommand() {
  if (state.historyStack.length === 0) return;
  
  const previousState = state.historyStack.pop();
  state.uiState = previousState;
  applyUIState();
  
  if (state.historyStack.length === 0) {
    elements.undoBtn.disabled = true;
  }
  
  showToast('✓ Undone', 'success');
}

/**
 * Reset UI to default
 */
async function resetUI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reset-ui`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      state.uiState = data.uiState;
      state.historyStack = [];
      elements.undoBtn.disabled = true;
      applyUIState();
      showToast('✓ UI reset', 'success');
    }
  } catch (error) {
    console.error('❌ Reset failed:', error);
    
    // Fallback local reset
    state.uiState = {
      background: 'light',
      layout: 'column',
      spacing: 'normal',
      components: []
    };
    state.historyStack = [];
    elements.undoBtn.disabled = true;
    applyUIState();
    showToast('✓ UI reset (local)', 'success');
  }
}

/**
 * Load UI state from backend
 */
async function loadUIState() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ui-state`);
    const data = await response.json();
    
    state.uiState = data;
    applyUIState();
    
    console.log('✅ Loaded UI state');
  } catch (error) {
    console.warn('⚠️ Could not load UI state, using defaults');
  }
}

/**
 * Save UI state to backend
 */
async function saveUIState() {
  try {
    await fetch(`${API_BASE_URL}/api/save-ui`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.uiState)
    });
  } catch (error) {
    console.warn('⚠️ Could not save UI state');
  }
}

/**
 * Show processing overlay
 */
function showProcessing(show) {
  elements.processingOverlay.style.display = show ? 'flex' : 'none';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Utility: Format time
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
