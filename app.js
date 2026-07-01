const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./database/createDatabase');
const offerRoutes = require('./routes/offerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const verificationRoutes = require('./routes/verificationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/offers', offerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/verification', verificationRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'acceptance-analytics-dashboard' });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Acceptance Analytics Dashboard running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
