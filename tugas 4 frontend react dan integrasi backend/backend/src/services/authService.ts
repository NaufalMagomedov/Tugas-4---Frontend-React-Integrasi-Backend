import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { signToken, type AuthUser } from './tokenService.ts';
import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import type { AuthUserDto } from '../dtos/authDto.ts';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findByEmail']>>>;

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  // Mapping row DB -> DTO. passwordHash SENGAJA tidak ikut.
  private toDto(row: UserRow): AuthUserDto {
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }

  async register(input: RegisterInput): Promise<AuthUserDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email sudah terdaftar.', 'EMAIL_TAKEN', [
        { field: 'email', message: 'Email ini sudah dipakai akun lain.' },
      ]);
    }

    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);

    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      // Role ditentukan server, bukan client. Pendaftaran mandiri = customer.
      role: 'customer',
    });
    if (!row) throw new AppError(500, 'USER_NOT_CREATED', 'User gagal dibuat.');

    return this.toDto(row);
  }

  /**
   * Mengembalikan token + user. Token TIDAK dikirim di body respons: controller
   * memasangnya sebagai cookie httpOnly sehingga tidak bisa dibaca JavaScript.
   */
  async login(input: LoginInput): Promise<{ token: string; user: AuthUserDto }> {
    const row = await this.userRepository.findByEmail(input.email);

    // Pesan sama untuk "email tidak terdaftar" dan "password salah", supaya
    // penyerang tidak bisa menebak email mana yang terdaftar.
    if (!row) throw new UnauthorizedError('Email atau password salah.');

    const passwordValid = await bcrypt.compare(input.password, row.passwordHash);
    if (!passwordValid) throw new UnauthorizedError('Email atau password salah.');

    const user: AuthUser = this.toDto(row);
    return { token: signToken(user), user };
  }

  /**
   * Data user terbaru dari database. Dipakai frontend untuk memulihkan sesi
   * setelah reload: role yang berubah atau akun yang sudah dihapus langsung
   * terlihat (token saja tidak tahu).
   */
  async me(userId: number): Promise<AuthUserDto> {
    const row = await this.userRepository.findById(userId);
    if (!row) throw new UnauthorizedError('Akun tidak ditemukan. Silakan login ulang.');
    return this.toDto(row);
  }
}
