import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { SyncModule } from './sync/sync.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('.render.com')
        ? { rejectUnauthorized: false }
        : false,
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    BusinessModule,
    SyncModule,
    ReportsModule,
  ],
})
export class AppModule {}
