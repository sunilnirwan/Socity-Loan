export interface AdminConfig {
  email: string;
  name: string;
  role: 'admin';
  phone?: string;
}

export interface AuthSession {
  user: {
    id?: number;
    userId: string;
    name: string;
    email: string;
    mobile?: string;
    totalAmount?: number;
    role: 'admin' | 'user';
  };
  role: 'admin' | 'user';
  token?: string;
}
