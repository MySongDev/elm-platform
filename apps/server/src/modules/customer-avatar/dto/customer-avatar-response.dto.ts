import { ApiProperty } from '@nestjs/swagger'

export class CustomerAvatarResponseDto {
  @ApiProperty({
    description: '头像的相对路径，展示时由前端拼接访问地址',
    example: 'avatars/3f1c2d7e-9a4b-4c6d-8e1f-2a3b4c5d6e7f.jpg',
  })
  avatar: string
}
