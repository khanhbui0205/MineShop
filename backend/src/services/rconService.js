const { Rcon } = require('rcon-client');

class RconService {
  constructor() {
    this.host = process.env.RCON_HOST;
    this.port = Number(process.env.RCON_PORT);
    this.password = process.env.RCON_PASSWORD;
  }

  validateConfig() {
    this.host = process.env.RCON_HOST;
    this.port = Number(process.env.RCON_PORT);
    this.password = process.env.RCON_PASSWORD;

    if (!this.host || !this.port || !this.password) {
      throw new Error('Thiếu cấu hình RCON (RCON_HOST, RCON_PORT, RCON_PASSWORD) trong .env');
    }
  }

  async sendCommand(command) {
    this.validateConfig();
    
    let rcon;
    try {
      rcon = await Rcon.connect({
        host: this.host,
        port: this.port,
        password: this.password,
      });

      const response = await rcon.send(command);
      return response;
    } finally {
      if (rcon) {
        await rcon.end();
      }
    }
  }

  async checkStatus() {
    this.validateConfig();
    
    let rcon;
    try {
      rcon = await Rcon.connect({
        host: this.host,
        port: this.port,
        password: this.password,
      });
      return { online: true };
    } catch (error) {
      return { online: false, error: error.message };
    } finally {
      if (rcon) {
        await rcon.end();
      }
    }
  }
}

module.exports = new RconService();
