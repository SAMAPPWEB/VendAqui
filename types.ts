
export type UserRole = 'ADMIN' | 'OPERADOR' | 'VENDEDOR' | 'GUIA' | 'CLIENTE' | 'DESENVOLVEDOR';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  status: 'ATIVO' | 'INATIVO';
  avatar?: string | null;
  senha?: string;
}

export interface Tour {
  id: string;
  image: string;
  title: string;
  price: string;
  duration: string;
  region: string;
  rating: string;
  active: boolean;
  description?: string;
}

export interface Client {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  endereco: string;
  senhaPortal: string;
  dataAtivacao: string; // ISO string
  status: 'ATIVO' | 'INATIVO';
  historico?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string | number;
  bookingNumber?: string; // Sequential ID (e.g., #Agend.0001)
  clientId: string;
  client: string;
  whatsapp: string;
  tour: string;
  date: string;
  time?: string; // Added for conflict detection
  pax: { adl: number, chd: number, free: number };
  price: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
  location: string;
  confirmed: boolean;
  observation?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  pax: { adl: number, chd: number, free: number };
  unitPrice: string;
  total: string;
}

export interface Budget {
  id: string;
  budgetNumber: string;
  clientName: string;
  clientWhatsapp: string;
  date: string;
  validUntil: string;
  items: BudgetItem[];
  totalAmount: string;
  notes: string;
  status: 'PENDENTE' | 'ENVIADO' | 'APROVADO' | 'CANCELADO' | 'VENCIDO' | 'REJEITADO';
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  status: 'PENDENTE' | 'PAGO';
  date: string;
  userName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WhiteLabelConfig {
  logo: string | null;
  primaryColor: string;
  instanceName: string;
  cnpj?: string;
  cadastur?: string;
  address?: string;
  phone?: string;
  instagram?: string;
  site?: string;
  pixKey?: string;
}

