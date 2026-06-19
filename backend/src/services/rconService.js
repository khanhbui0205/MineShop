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
    const commandText = String(command || '').trim();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    console.log(`[RCON SERVICE] [${requestId}] sendCommand entry: "${commandText}"`);
    try {
      console.log(`[RCON SERVICE] [${requestId}] connecting to ${this.host}:${this.port}`);
      rcon = await Rcon.connect({
        host: this.host,
        port: this.port,
        password: this.password,
      });

      console.log(`[RCON SERVICE] [${requestId}] before RCON send: "${commandText}"`);
      const response = await rcon.send(commandText);
      console.log(`[RCON SERVICE] [${requestId}] after RCON send: ${String(response || '').trim() || '(empty)'}`);
      return response;
    } catch (error) {
      console.error(`[RCON SERVICE] [${requestId}] caught exception for "${commandText}": ${error.message}`);
      throw error;
    } finally {
      if (rcon) {
        console.log(`[RCON SERVICE] [${requestId}] closing RCON connection`);
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
