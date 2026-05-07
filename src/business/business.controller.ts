import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.strategy';
import { BusinessService } from './business.service';

class UpdateBusinessDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() verticalType?: string;
  @IsOptional() @IsObject() verticalConfig?: Record<string, unknown>;
}

type CloudUser = { id: string; businessId: string; role: string };

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private business: BusinessService) {}

  @Get()
  get(@CurrentUser() user: CloudUser) {
    return this.business.get(user.businessId);
  }

  @Patch()
  update(@CurrentUser() user: CloudUser, @Body() dto: UpdateBusinessDto) {
    return this.business.update(user.businessId, dto);
  }
}
