require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { app: electronApp } = require('electron');
const RiotApiService = require('./riotService');

class Server {
  constructor() {
    this.app = express();
    this.requestTimestamps = new Map();
    this.RATE_LIMIT_WINDOW = 1000;
    this.setupMiddleware();
    this.setupRoutes();
  }

  async loadConfig() {
    try {
      const configPath = path.join(electronApp.getPath('userData'), 'config.json');
      const data = await fs.readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading config:', error);
      return null;
    }
  }

  setupMiddleware() {
    this.app.use(express.json());

    this.app.use((req, res, next) => {
      const now = Date.now();
      const ip = req.ip;

      if (!this.requestTimestamps.has(ip)) {
        this.requestTimestamps.set(ip, []);
      }

      const requests = this.requestTimestamps.get(ip);
      const validRequests = requests.filter(time => now - time < this.RATE_LIMIT_WINDOW);

      if (validRequests.length >= 5) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: this.RATE_LIMIT_WINDOW,
        });
      }

      validRequests.push(now);
      this.requestTimestamps.set(ip, validRequests);
      next();
    });

    // CORS middleware
    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  setupRoutes() {
    this.app.get('/api/stats', async (req, res) => {
      console.log('Received stats request');
      try {
        const config = await this.loadConfig();
        if (!config) {
          console.log('No config found');
          return res.status(400).json({ error: 'Configuration not found' });
        }

        const riotService = new RiotApiService(config.region);
        console.log('Fetching KDA data...');
        const kdaData = await riotService.getKDAStats(config.summonerNamesURL);
        console.log('Sending KDA data response', kdaData);
        res.json(kdaData);
      } catch (error) {
        console.error('Error in stats endpoint:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    });
  }

  start(port = 3000) {
    return this.app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  }
}

function startServer() {
  const server = new Server();
  return server.start();
}

module.exports = { startServer };
