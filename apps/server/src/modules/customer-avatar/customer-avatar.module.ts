import { Module } from '@nestjs/common'
import { FILE_STORAGE, LocalDiskStorage } from '../storage/local-disk.storage'
import { CustomerAvatarController } from './customer-avatar.controller'
import { CustomerAvatarService } from './customer-avatar.service'

@Module({
  controllers: [CustomerAvatarController],
  providers: [
    CustomerAvatarService,
    {
      provide: FILE_STORAGE,
      useClass: LocalDiskStorage,
    },
  ],
})
export class CustomerAvatarModule {}
