import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { UnauthorizedError } from '../../../shared/errors';

// Mock UserRepository
class MockUserRepository extends UserRepository {
  private mockUsers: Map<string, any> = new Map();

  constructor() {
    super(null as any);
  }

  async findByEmail(email: string) {
    return this.mockUsers.get(email) || null;
  }

  async findById(id: string) {
    for (const user of this.mockUsers.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  async update(id: string, data: any) {
    const user = await this.findById(id);
    if (user) {
      Object.assign(user, data);
      return user;
    }
    return null;
  }

  setMockUser(email: string, user: any) {
    this.mockUsers.set(email, user);
  }

  clearMockUsers() {
    this.mockUsers.clear();
  }
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    authService = new AuthService(mockUserRepository);
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Hash password for test user
      const passwordHash = await authService.hashPassword('password123');
      
      mockUserRepository.setMockUser('test@example.com', {
        id: '123',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should throw UnauthorizedError for invalid email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const passwordHash = await authService.hashPassword('password123');
      
      mockUserRepository.setMockUser('test@example.com', {
        id: '123',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for inactive user', async () => {
      const passwordHash = await authService.hashPassword('password123');
      
      mockUserRepository.setMockUser('test@example.com', {
        id: '123',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: false,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'admin',
      };

      const tokens = authService.generateTokens(payload);
      const verified = authService.verifyToken(tokens.accessToken);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe(payload.role);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow(UnauthorizedError);
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'password123';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const oldPasswordHash = await authService.hashPassword('oldpassword');
      
      mockUserRepository.setMockUser('test@example.com', {
        id: '123',
        email: 'test@example.com',
        password_hash: oldPasswordHash,
        role: 'admin',
        is_active: true,
      });

      await authService.changePassword('123', 'oldpassword', 'newpassword');

      // Verify password was changed by trying to login with new password
      const result = await authService.login({
        email: 'test@example.com',
        password: 'newpassword',
      });

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedError for invalid old password', async () => {
      const oldPasswordHash = await authService.hashPassword('oldpassword');
      
      mockUserRepository.setMockUser('test@example.com', {
        id: '123',
        email: 'test@example.com',
        password_hash: oldPasswordHash,
        role: 'admin',
        is_active: true,
      });

      await expect(
        authService.changePassword('123', 'wrongpassword', 'newpassword')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
