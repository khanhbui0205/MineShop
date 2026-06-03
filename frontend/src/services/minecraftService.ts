import api from '../lib/api';

export interface MinecraftBalanceResponse {
  success: boolean;
  username: string;
  balance: number;
}

export interface PlayerVerificationResponse {
  exists: boolean;
  realName: string;
  message: string;
}

const minecraftService = {
  getPlayerBalance: async (username: string): Promise<MinecraftBalanceResponse> => {
    const response = await api.get(`/minecraft/balance/${username}`);
    return response.data;
  },

  verifyPlayer: async (username: string): Promise<PlayerVerificationResponse> => {
    const response = await api.post('/minecraft/verify', { username });
    return response.data;
  },

  linkAccount: async (username: string) => {
    const response = await api.post('/users/link-minecraft', { minecraftUsername: username });
    return response.data;
  }
};

export default minecraftService;
