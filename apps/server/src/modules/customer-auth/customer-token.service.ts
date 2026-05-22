import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type CustomerUserLike = {
  id: number;
  phone: string;
  nickname?: string | null;
  avatar?: string | null;
  status: number;
};

@Injectable()
export class CustomerTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(user: CustomerUserLike) {
    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      subjectType: 'customer',
    });

    return {
      token,
      user: this.toProfile(user),
    };
  }

  toProfile(user: CustomerUserLike) {
    return {
      id: user.id,
      user_id: user.id,
      phone: user.phone,
      mobile: user.phone,
      username: user.nickname || user.phone,
      nickname: user.nickname,
      avatar: user.avatar || 'default.jpg',
      status: user.status,
    };
  }
}
