import api from '../lib/api';

export interface MinecraftBalanceResponse {
  success: boolean;
  username: string;
  balance: number;
  syncedAt?: string;
}

export interface PlayerCheckResponse {
  success: boolean;
  playerExists: boolean;
  username: string;
  balance: number;
  rank?: string;
  isRegistered?: boolean;
  message: string;
  error?: string;
}

const minecraftService = {
  /**
   * Lấy số dư Minecraft thực tế của người dùng.
   * Yêu cầu đăng nhập. Backend sẽ verify player tồn tại trước khi lấy balance.
   */
  getPlayerBalance: async (username: string): Promise<MinecraftBalanceResponse> => {
    const response = await api.get(`/minecraft/balance/${username}`);
    return response.data;
  },

  /**
   * Kiểm tra player có tồn tại trên server không (dùng khi đăng ký).
   */
  checkPlayer: async (playerName: string): Promise<PlayerCheckResponse> => {
    const response = await api.post('/minecraft/check-player', { playerName });
    return response.data;
  },
};

export default minecraftService;
