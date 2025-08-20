export class User {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  email: string;
  password: string;
  phone?: string;
  created_at: Date;
}
