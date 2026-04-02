import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { loginSchema, changePasswordSchema, refreshTokenSchema } from '../schemas/auth.schema';
import { ValidationError } from '../../../shared/errors';

export class AuthController {
  private authService: AuthService;

  constructor(private userRepository: UserRepository) {
    this.authService = new AuthService(userRepository);
  }

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { email, password } = validationResult.data;

      // Perform login
      const tokens = await this.authService.login({ email, password });

      // Get user data
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new ValidationError('User not found after login');
      }

      // Calculate expiration details
      const accessExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
      const refreshExpiresAt = new Date(Date.now() + tokens.refreshExpiresIn * 1000);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          tokens: {
            access: {
              token: tokens.accessToken,
              expiresIn: tokens.expiresIn,
              expiresAt: accessExpiresAt.toISOString(),
            },
            refresh: {
              token: tokens.refreshToken,
              expiresIn: tokens.refreshExpiresIn,
              expiresAt: refreshExpiresAt.toISOString(),
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Logout (client-side token removal)
   */
  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // In JWT-based auth, logout is handled client-side by removing the token
      // This endpoint exists for consistency and future enhancements (e.g., token blacklisting)
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = refreshTokenSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { refreshToken } = validationResult.data;

      // Verify refresh token
      const payload = this.authService.verifyToken(refreshToken);

      // Generate new tokens
      const tokens = this.authService.generateTokens(payload);

      // Calculate expiration details
      const accessExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
      const refreshExpiresAt = new Date(Date.now() + tokens.refreshExpiresIn * 1000);

      res.json({
        success: true,
        data: {
          tokens: {
            access: {
              token: tokens.accessToken,
              expiresIn: tokens.expiresIn,
              expiresAt: accessExpiresAt.toISOString(),
            },
            refresh: {
              token: tokens.refreshToken,
              expiresIn: tokens.refreshExpiresIn,
              expiresAt: refreshExpiresAt.toISOString(),
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/auth/me
   * Get current user information
   */
  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User is attached by auth middleware
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Get full user data
      const user = await this.userRepository.findById(req.user.userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login?.toISOString() || null,
          created_at: user.created_at.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/change-password
   * Change user password
   */
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User is attached by auth middleware
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = changePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const { oldPassword, newPassword } = validationResult.data;

      // Change password
      await this.authService.changePassword(req.user.userId, oldPassword, newPassword);

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
