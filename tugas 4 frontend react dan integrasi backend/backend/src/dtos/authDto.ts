/** Data user yang aman dikirim ke client — TIDAK menyertakan passwordHash. */
export interface AuthUserDto {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
}
