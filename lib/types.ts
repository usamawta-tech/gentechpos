export interface Product {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSetting {
  id: number;
  storeName: string;
  address: string;
  phone: string;
  footer: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number | null;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: number;
  createdAt: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  items: SaleItem[];
  customerId?: number | null;
  customer?: Customer | null;
  cashierId?: number | null;
  cashier?: { name: string } | null;
}

export interface CartLine {
  productId: number;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}
