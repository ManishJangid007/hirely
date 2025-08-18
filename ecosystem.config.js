module.exports = {
    apps: [
        {
            name: 'hirely-interview-app',
            script: 'npx',
            args: 'serve -s build -l 3000 --single',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        }
    ]
}; 