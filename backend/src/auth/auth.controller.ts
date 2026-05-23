import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from './current-user.decorator';
import { UpdateProfileDto } from './auth.service';
import { TokenAuthGuard } from './token-auth.guard';

class SendResetCodeDto {
  email: string;
}

class ResetPasswordByCodeDto {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { message: '注册成功', data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { message: '登录成功', data };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: '如果该邮箱已注册，重置密码链接已发送', data: null };
  }

  @Post('send-reset-code')
  @HttpCode(HttpStatus.OK)
  async sendResetCode(@Body() dto: SendResetCodeDto) {
    await this.authService.sendResetCode(dto.email);
    return { message: '如果该邮箱已注册，验证码已发送', data: null };
  }

  @Post('reset-password-by-code')
  @HttpCode(HttpStatus.OK)
  async resetPasswordByCode(@Body() dto: ResetPasswordByCodeDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致');
    }
    await this.authService.resetPasswordByCode(dto.email, dto.code, dto.password);
    return { message: '密码重置成功', data: null };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: '密码重置成功', data: null };
  }

  @UseGuards(TokenAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: { id: string; email: string }) {
    const data = await this.authService.getUserById(user.id);
    return { message: '获取用户信息成功', data };
  }

  @UseGuards(TokenAuthGuard)
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.authService.updateProfile(user.id, dto);
    return { message: '更新用户信息成功', data };
  }

  @UseGuards(TokenAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Req() request: Request & { authTokenHash?: string },
  ) {
    await this.authService.logout(userId, request.authTokenHash || '');
    return { message: '退出登录成功', data: null };
  }
}
