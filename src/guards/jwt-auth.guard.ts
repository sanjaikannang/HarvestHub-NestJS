import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';
import { UserRole } from '../utils/enum';

interface JwtPayloadWithRole extends jwt.JwtPayload {
  role: UserRole;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // Verify the JWT token
      const payload = jwt.verify(token, this.configService.getJWTSecretKey()) as JwtPayloadWithRole;

      // Add user information to request object
      request.user = payload;

      // Check if roles are required for this route
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);

      // If no roles are required, allow access
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Check if user has required role
      if (!requiredRoles.includes(payload.role)) {
        // Custom error message for incorrect roles
        throw new ForbiddenException(`Access denied: User with role '${payload.role}' is not authorized to access this resource. Required roles: ${requiredRoles.join(', ')}`);
      }

      return true;

    } catch (error) {
      if (error instanceof ForbiddenException) {
        // Rethrow our custom ForbiddenException
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}