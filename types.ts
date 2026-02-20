export interface Product {
  id: string;
  name: string;
  brand?: string;
  providerCost: number;
  freightCost: number;
  markupPercent: number;
  cardSurchargePercent: number;
  currentStock: number;
  minStock: number;
  flavors?: string[];
  unitsPerBox?: number;
}

export type ProductStatus = 'OK' | 'PEDIR' | 'AGOTADO';

export interface CalculatedFields {
  realCost: number;
  cashPrice: number;
  listPriceTN: number;
  netProfit: number;
  inventoryValue: number;
  wholesalePrice: number;
  status: ProductStatus;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta Crédito' | 'Débito' | 'Bancor' | 'Carta Personal' | 'Canje/Servicio';

export interface DailySale {
  id: string;
  date: string;
  productName: string; 
  channel: 'Física' | 'Online';
  paymentMethod: PaymentMethod;
  totalAmount: number;
  amountPaid: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  currentStock: number;
}

export interface ClientInfo {
  name: string;
  location: string;
  phone: string;
}

export interface PurchaseInvoice {
  id: string;
  date: string;
  vendor: 'Disfit' | 'Bunker' | 'ColoMayorista' | 'Suplemed' | 'Otro';
  invoiceNumber?: string;
  goodsAmount: number;
  shippingCost: number;
  notes: string;
}

export type AppView = 'inventory' | 'daily_log' | 'wholesale' | 'purchases' | 'expenses' | 'calculator' | 'partners' | 'combos';

export interface Trainer {
  id: string;
  name: string;
  couponTrainer: string;
  couponClient: string;
  phone: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}

export interface TrainerSale {
  id: string;
  trainerId: string;
  clientName: string;
  clientPhone?: string;
  date: string;
  amount: number;
  productName: string;
  couponUsed: 'trainer' | 'client';
}

export interface TrainerMonthlyStats {
  month: string;
  trainerId: string;
  uniqueClients: number;
  totalSales: number;
  totalAmount: number;
  discountLevel: 20 | 25 | 35;
  reimbursementOwed: number;
}