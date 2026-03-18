module.exports = {
  apps: [
    {
      name: "nextjs-app",
      cwd: "/var/www/nextjs-app/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env_file: "/var/www/nextjs-app/env/production.env",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
