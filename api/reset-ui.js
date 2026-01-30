const defaultState = {
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
  components: []
};

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

  return res.status(200).json({
    success: true,
    uiState: defaultState,
    message: 'UI reset to defaults'
  });
};
