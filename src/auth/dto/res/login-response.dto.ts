export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    role: string;
    username: string;
    phone: string;
    created_at: Date;
  };
}
