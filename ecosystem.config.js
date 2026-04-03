module.exports = {
    apps: [
        {
            name: 'crous-whatsapp',
            interpreter: '/home/ubuntu/.bun/bin/bun',
            script: 'src/index.ts',
            cwd: '/home/ubuntu/Crous_on_whatsapp',
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
