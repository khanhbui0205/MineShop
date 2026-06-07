import api from '../lib/api';

export interface MinecraftBalanceResponse {
  success: boolean;
  username: string;
  balance: number;
  syncedAt?: string;
}

export interface PlayerVerificationResponse {
  success: boolean;
  playerExists: boolean;
  username: string;
  message: string;
  error?: string;
}

export interface PlayerCheckResponse {
  success: boolean;
  playerExists: boolean;
  username: string;
  balance: number;
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
   * Xác thực player tồn tại trên server (yêu cầu đăng nhập).
   * Dùng khi liên kết tài khoản Minecraft trong profile.
   */
  verifyPlayer: async (username: string): Promise<PlayerVerificationResponse> => {
    const response = await api.post('/minecraft/verify', { username });
    return response.data;
  },

  /**
   * Kiểm tra nhanh player có tồn tại trên server không (KHÔNG cần đăng nhập).
   * Dùng trong flow mua hàng để xác nhận tên player TRƯỚC khi tạo hóa đơn.
   * Trả về cả realName (đúng hoa thường) và balance hiện tại.
   */
  checkPlayer: async (playerName: string): Promise<PlayerCheckResponse> => {
    const response = await api.post('/minecraft/check-player', { playerName });
    return response.data;
  },

  /**
   * Liên kết tài khoản Minecraft. Gọi userController.linkMinecraft ở backend.
   * Backend sẽ verify player qua RCON trước khi lưu.
   */
  linkAccount: async (username: string) => {
    const response = await api.post('/users/link-minecraft', { minecraftUsername: username });
    return response.data;
  }
};

export default minecraftService;
