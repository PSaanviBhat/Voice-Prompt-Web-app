module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    aiEnabled: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
};
