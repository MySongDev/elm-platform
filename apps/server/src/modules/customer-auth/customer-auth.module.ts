import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { SmsModule } from '../sms/sms.module'
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
  providers: [CustomerAuthService, CustomerTokenService],
  exports: [CustomerAuthService, CustomerTokenService, SmsModule],
})
export class CustomerAuthModule {}
