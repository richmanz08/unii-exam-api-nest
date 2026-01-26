import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Copy of Unii Digital Group Assignment (Full-Stack Position)';
  }
}
