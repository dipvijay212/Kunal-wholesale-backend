const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const { ensureOptionalColumns } = require('./utils/optionalColumns');

const app = express();

// Security HTTP headers
app.use(helmet());

// Dynamic CORS configuration based on FRONTEND_URL environment variable
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['http://localhost:3000'];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (process.env.NODE_ENV === 'development') return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'kunalsarees.in' ||
      host.endsWith('.kunalsarees.in') ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return true;
    }
  } catch {
    // invalid URL format
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: Origin ${origin} is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kunal Sarees Wholesale API is active and running',
    timestamp: new Date().toISOString(),
  });
});

// Skip columns from migrations that haven't run yet (checked once per process)
app.use('/api', (req, res, next) => {
  ensureOptionalColumns().then(() => next(), () => next());
});

// Mount API routes under /api
app.use('/api', routes);

// Centralized 404 Route Not Found handler
app.use(notFoundHandler);

// Centralized Error handler
app.use(errorHandler);

module.exports = app;
