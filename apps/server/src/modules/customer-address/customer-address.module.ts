import { Module } from '@nestjs/common'
import { CustomerAddressService } from './customer-address.service'

@Module({
  providers: [CustomerAddressService],
  exports: [CustomerAddressService],
})
export class CustomerAddressModule {}
