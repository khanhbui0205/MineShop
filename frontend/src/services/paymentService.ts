import http from '../lib/api';

export interface CreatePaymentResponse {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  transactionId: string;
}

export interface PaymentTransaction {
  _id: string;
  id?: string;
  orderCode: number;
  amount: number;
  coinsChange: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'pending' | 'completed' | 'cancelled' | 'failed';
  item: string;
  packageName?: string;
  transactionId?: string;
  payosOrderId?: string;
  playerName?: string;
  minecraftUsername?: string;
  createdAt: string;
  paidAt?: string;
  paymentUrl?: string;
  qrCode?: string;
  accountNumber?: string;
  accountName?: string;
  description?: string;
  bankName?: string;
}

const paymentService = {
  createPayment: async (packageId: string): Promise<CreatePaymentResponse> => {
    const response = await http.post('/payment/create', { packageId });
    return response.data;
  },

  getPaymentStatus: async (orderCode: number): Promise<{
    id?: string;
    _id?: string;
    status: string;
    orderCode?: number;
    amount?: number;
    item?: string;
    packageName?: string;
    paidAt?: string;
    transactionId?: string;
    paymentUrl?: string;
  }> => {
    const response = await http.get(`/payment/status/${orderCode}`);
    return response.data;
  },

  getResumePayment: async (id: string): Promise<PaymentTransaction> => {
    const response = await http.get(`/payment/resume/${id}`);
    return response.data;
  },

  getHistory: async (page = 1, limit = 10, status?: string) => {
    const response = await http.get('/payment/history', {
      params: { page, limit, status },
    });
    return response.data;
  },

  getPaymentById: async (id: string): Promise<PaymentTransaction> => {
    const response = await http.get(`/payment/${id}`);
    return response.data;
  },

  checkPaymentStatus: async (orderCode: number): Promise<{ status: string, message?: string, id?: string, _id?: string }> => {
    const response = await http.get(`/payment/check/${orderCode}`);
    return response.data;
  },
};

export default paymentService;
