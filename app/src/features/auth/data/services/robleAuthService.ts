import { RobleConfig } from '../../../core/config/robleConfig';
import { robleHttpService } from '../../../core/services/robleHttpService';
import {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  SignupRequest,
} from '../../../core/types/auth';
import { mapToUser, User } from '../../domain/models/user';

export class RobleAuthService {
  constructor(private readonly http = robleHttpService) {}

  async login(email: string, password: string): Promise<User | null> {
    const request: LoginRequest = { email: email.trim(), password };
    const tokens = await this.http.login(request);

    if (!tokens) {
      return null;
    }

    if (tokens.user) {
      return mapToUser(tokens.user);
    }

    return this.getUserInfo();
  }

  async signup(email: string, password: string, name: string): Promise<boolean> {
    const request: SignupRequest = {
      email: email.trim(),
      password,
      name: name.trim(),
    };
    return this.http.signup(request);
  }

  async signupDirect(
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> {
    const request: SignupRequest = {
      email: email.trim(),
      password,
      name: name.trim(),
    };
    return this.http.signupDirect(request);
  }

  async verifyEmail(email: string, code: string): Promise<boolean> {
    return this.http.verifyEmail({ email: email.trim(), code });
  }

  async forgotPassword(email: string): Promise<boolean> {
    const request: ForgotPasswordRequest = { email: email.trim() };
    return this.http.forgotPassword(request);
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const request: ResetPasswordRequest = { token, newPassword };
    return this.http.resetPassword(request);
  }

  async logout(): Promise<boolean> {
    try {
      return await this.http.logout();
    } catch {
      await this.http.clearTokens();
      return true;
    }
  }

  async isTokenValid(): Promise<boolean> {
    return this.http.verifyToken();
  }

  async getUserInfo(): Promise<User | null> {
    try {
      const response = await this.http.dio.get(RobleConfig.verifyTokenEndpoint);
      if (response.status === 200 && response.data?.valid) {
        const payload = response.data.user ?? {};
        const resolved = {
          id: payload.sub ?? payload.id ?? payload._id,
          email: payload.email ?? payload.username ?? 'usuario@uninorte.edu.co',
          name: payload.name ?? payload.email ?? 'Usuario',
          image: payload.avatarUrl ?? payload.image ?? null,
          uuid: payload.sub ?? payload.id ?? payload._id,
        };
        return mapToUser(resolved);
      }
    } catch {
      // Silent catch mirrors Flutter fallback behaviour
    }
    return null;
  }

  async getStoredTokens(): Promise<Record<string, string | null>> {
    const [accessToken, refreshToken] = await Promise.all([
      this.http.getAccessToken(),
      this.http.getRefreshToken(),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.http.getAccessToken();
    if (!accessToken) return false;
    return this.isTokenValid();
  }
}

export const robleAuthService = new RobleAuthService();
