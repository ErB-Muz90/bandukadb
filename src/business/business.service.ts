import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../database/entities';

@Injectable()
export class BusinessService {
  constructor(@InjectRepository(Business) private businesses: Repository<Business>) {}

  async get(businessId: string): Promise<Business> {
    const business = await this.businesses.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async update(businessId: string, changes: Partial<Business>): Promise<Business> {
    await this.businesses.update(businessId, changes as never);
    return this.get(businessId);
  }
}
