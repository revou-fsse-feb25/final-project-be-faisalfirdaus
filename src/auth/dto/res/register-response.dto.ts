export class RegisterResponseDto {
  id: string; // or number – keep consistent with your schema
  email: string;
  username: string;
  role: string;
  phone?: string | null;
  createdAt: Date;
}
