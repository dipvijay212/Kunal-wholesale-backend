const dotenv = require('dotenv');

// Load environment variables before initializing application modules
dotenv.config();

const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Verify MySQL database connection
    console.log('[Server] Initializing MySQL Database Connection...');
    await testConnection();

    // 2. Start HTTP Express Server
    const server = app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Kunal Sarees API Server is running!`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 URL:         http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`==================================================`);
    });

    // Graceful Shutdown Handlers
    const handleShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down server gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ [Server Fatal Error] Failed to start backend server due to database connection failure.');
    console.error('   Please ensure MySQL service is running and credentials in .env are correct.');
    console.error(`   Error Details: ${error.message}`);
    process.exit(1);
  }
};

startServer();
