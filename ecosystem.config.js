module.exports = {
    apps: [
        {
            name: 'crous-whatsapp',
            script: 'dist/index.js',
            cwd: __dirname,
            env: {
                NODE_ENV: 'production',
            },
            restart_delay: 5000,
            max_restarts: 10,
            autorestart: true,
            watch: false,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
        },
    ],
};
