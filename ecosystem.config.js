module.exports = {
  apps: [{
    name: "feed",
    script: "./dist/index.js",
    max_restarts: 5,
    min_uptime: "40s",
    exp_backoff_restart_delay: 300,
  }]
}