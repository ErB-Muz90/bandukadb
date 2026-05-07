import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { Director, Business } from '../database/entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Director) private directors: Repository<Director>,
    @InjectRepository(Business) private businesses: Repository<Business>,
    private jwt: JwtService,
  ) {}

  async register(dto: {
    businessName: string;
    email: string;
    password: string;
    phone?: string;
    verticalType?: string;
  }) {
    const existing = await this.directors.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const businessId = uuid();
    const business = this.businesses.create({
      id: businessId,
      name: dto.businessName,
      phone: dto.phone,
      email: dto.email,
      verticalType: dto.verticalType ?? 'generic',
      status: 'active',
    });
    await this.businesses.save(business);

    const director = this.directors.create({
      id: uuid(),
      businessId,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 12),
      role: 'owner',
      status: 'active',
    });
    await this.directors.save(director);

    return this.buildTokenResponse(director, business);
  }

  async login(email: string, password: string) {
    const director = await this.directors.findOne({ where: { email } });
    if (!director) throw new UnauthorizedException('Invalid credentials');
    if (director.status !== 'active') throw new UnauthorizedException('Account inactive');

    const valid = await bcrypt.compare(password, director.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const business = await this.businesses.findOne({ where: { id: director.businessId } });
    return this.buildTokenResponse(director, business!);
  }

  async validateDirector(id: string): Promise<Director | null> {
    return this.directors.findOne({ where: { id, status: 'active' } });
  }

  private buildTokenResponse(director: Director, business: Business) {
    const payload = { sub: director.id, businessId: director.businessId, role: director.role };
    return {
      accessToken: this.jwt.sign(payload),
      director: { id: director.id, email: director.email, role: director.role, businessId: director.businessId },
      business: { id: business.id, name: business.name, verticalType: business.verticalType },
    };
  }
}
