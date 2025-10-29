import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, status: 'active' },
      include: { organization: true },
    });

    if (user && await bcrypt.compare(password, user.hashed_password)) {
      const { hashed_password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      org_id: user.org_id,
      role: user.role 
    };

    // Get all organizations user has access to
    const organizations = await this.prisma.organization.findMany({
      where: {
        users: {
          some: { id: user.id }
        }
      }
    });

    return {
      token: this.jwtService.sign(payload),
      user,
      organizations,
    };
  }

  async getCurrentUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
  }
}
