module.exports = {
  apps: [
    {
      name: 'rh-api-all',
      script: 'src/app.js',
      args: 'mainApp usaApp jpnApp proxyServer',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'rh-api-usa',
      script: 'src/app.js',
      args: 'mainApp usaApp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },  
    {
      name: 'rh-api-jpn',
      script: 'src/app.js',
      args: 'mainApp jpnApp proxyServer',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
