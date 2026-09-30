require('./config/env'); // must run first — loads .env and validates required vars

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/DB');

const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');
const orderRoutes = require('./routes/orders');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // Railway sits behind a proxy

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https://res.cloudinary.com']
    }
  }
}));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// ---------- API routes ----------
app.use('/api', adminRoutes);
app.use('/api', productRoutes);
app.use('/api', reviewRoutes);
app.use('/api', orderRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Pages (frontend lives in /public) ----------
app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Must be registered after every route.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log('Running on ' + PORT)))
  .catch(e => { console.error(e); process.exit(1); });