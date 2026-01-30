module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In serverless, state doesn't persist between invocations
  // For a real app, you'd save to a database here
  return res.status(200).json({ 
    success: true,
    message: 'State saved (note: serverless functions don\'t persist state)'
  });
};
