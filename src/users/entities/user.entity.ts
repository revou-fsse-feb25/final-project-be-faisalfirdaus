export class User {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  email: string;
  password: string;
  phone?: string;
  created_at: Date;
}
