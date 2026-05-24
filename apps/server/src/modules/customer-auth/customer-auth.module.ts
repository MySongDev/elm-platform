import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { SmsModule } from '../sms/sms.module'
import { CustomerAuthController } from './customer-auth.controller'
import { CustomerAuthService } from './customer-auth.service'
import { CustomerTokenService } from './customer-token.service'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'elm-admin-secret',
      signOptions: { expiresIn: '24h' },
    }),
    SmsModule,
  ],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerTokenService],
})
export class CustomerAuthModule {}
