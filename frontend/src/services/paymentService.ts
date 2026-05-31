import http from '../lib/api';

export interface CreatePaymentResponse {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  transactionId: string;
}

export interface PaymentTransaction {
  _id: string;
  orderCode: number;
  amount: number;
  coinsChange: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
  item: string;
  createdAt: string;
  paymentUrl?: string;
  qrCode?: string;
}

const paymentService = {
  createPayment: async (packageId: string): Promise<CreatePaymentResponse> => {
    const response = await http.post('/payment/create', { packageId });
    return response.data;
  },

  getPaymentStatus: async (orderCode: number): Promise<{ status: string }> => {
    const response = await http.get(`/payment/status/${orderCode}`);
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
};

export default paymentService;
