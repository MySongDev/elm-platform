import { Module } from '@nestjs/common'
import { FILE_STORAGE, LocalDiskStorage } from '../storage/local-disk.storage'
import { CustomerAvatarService } from './customer-avatar.service'

@Module({
  providers: [
    CustomerAvatarService,
    {
      provide: FILE_STORAGE,
      useClass: LocalDiskStorage,
    },
  ],
  exports: [CustomerAvatarService],
})
export class CustomerAvatarModule {}
