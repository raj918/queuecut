import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return sendSuccess(res, result, 'Registration successful', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Registration failed', 400);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login(identifier, password);
      return sendSuccess(res, result, 'Login successful', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Login failed', 401);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(refreshToken);
      return sendSuccess(res, tokens, 'Token refreshed successfully', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Token refresh failed', 401);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthenticated', 401);
      }
      const user = await AuthService.getMe(req.user.userId);
      return sendSuccess(res, user, 'Profile retrieved', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch user', 404);
    }
  }

  static async logout(req: Request, res: Response) {
    // Stateless JWT, client deletes tokens. Backend can clear device token if provided in body.
    return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
  }
}
