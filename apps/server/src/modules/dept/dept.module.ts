import { Module } from '@nestjs/common'
import { DeptService } from './dept.service'

@Module({
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}
