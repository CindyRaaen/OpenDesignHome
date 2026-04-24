// Vercel serverless entry point — wraps the Express app
let app;
try {
  const mod = await import('../server/src/index.js');
  app = mod.default;
} catch (err) {
  console.error('FATAL IMPORT ERROR:', err.message, err.stack);
  app = (req, res) => res.status(500).json({ error: 'Server init failed', message: err.message });
}
export default app;
