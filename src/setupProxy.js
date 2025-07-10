const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    console.log('Setting up proxy for /api routes to http://localhost:8080 (Docker environment)');

    // Create proxy middleware with simplified configuration
    const apiProxy = createProxyMiddleware({
        target: 'http://localhost:8080',
        changeOrigin: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('[PROXY] Error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Proxy error',
                    message: err.message,
                    url: req.url,
                    target: 'http://localhost:8080'
                });
            }
        }
    });

    // Apply the proxy middleware
    app.use('/api', apiProxy);

    console.log('Proxy setup complete for Docker environment');
    console.log('Available endpoints:');
    console.log('  - /api/health');
    console.log('  - /api/client-info');
    console.log('  - /api/tasks');
    console.log('  - /api/projects');
}; 