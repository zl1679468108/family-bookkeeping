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
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SwitchAccountDto } from './dto/switch-account.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from './current-user.decorator';
import { UpdateProfileDto } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokenAuthGuard } from './token-auth.guard';
import { CaptchaService } from './captcha.service';
import { RateLimitGuard } from './rate-limit.guard';
import { SendResetCodeDto } from './dto/send-reset-code.dto';
import { ResetPasswordByCodeDto } from './dto/reset-password-by-code.dto';
import { RefreshDto } from './dto/refresh.dto';

/** B-M2: DTO for setCurrentBook */
class SetCurrentBookDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  book_id: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @UseGuards(new RateLimitGuard(60_000, 10))
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { message: '注册成功', data };
  }

  @Get('captcha')
  @UseGuards(new RateLimitGuard(60_000, 30))
  async getCaptcha() {
    const { captchaId, svg } = this.captchaService.generate();
    return { data: { captchaId, svg } };
  }

  @UseGuards(new RateLimitGuard(60_000, 10))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { message: '登录成功', data };
  }

  @UseGuards(new RateLimitGuard(60_000, 10))
  @Post('switch-account')
  @HttpCode(HttpStatus.OK)
  async switchAccount(@Body() dto: SwitchAccountDto) {
    const data = await this.authService.switchAccount(dto);
    return { message: '账号切换成功', data };
  }

  // 双 Token：用长令牌（refresh）换发新的访问令牌（access）
  // 不挂 TokenAuthGuard（否则无法在 access 过期时调用）
  @UseGuards(new RateLimitGuard(60_000, 20))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    const data = await this.authService.refreshAuth(dto.refreshToken);
    return { message: '刷新成功', data };
  }

  @UseGuards(new RateLimitGuard(60_000, 5))
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: '如果该邮箱已注册，重置密码链接已发送', data: null };
  }

  @UseGuards(new RateLimitGuard(60_000, 5))
  @Post('send-reset-code')
  @HttpCode(HttpStatus.OK)
  async sendResetCode(@Body() dto: SendResetCodeDto) {
    await this.authService.sendResetCode(dto.email);
    return { message: '如果该邮箱已注册，验证码已发送', data: null };
  }

  @UseGuards(new RateLimitGuard(60_000, 5))
  @Post('reset-password-by-code')
  @HttpCode(HttpStatus.OK)
  async resetPasswordByCode(@Body() dto: ResetPasswordByCodeDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致');
    }
    await this.authService.resetPasswordByCode(dto.email, dto.code, dto.password);
    return { message: '密码重置成功', data: null };
  }

  @UseGuards(new RateLimitGuard(60_000, 5))
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

  @UseGuards(TokenAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, dto);
    return { message: '密码修改成功', data: null };
  }

  @UseGuards(TokenAuthGuard)
  @Put('current-book')
  @HttpCode(HttpStatus.OK)
  async setCurrentBook(
    @CurrentUser() user: { id: string },
    @Body() dto: SetCurrentBookDto,
  ) {
    await this.authService.setCurrentBook(user.id, dto.book_id);
    return { message: '设置当前账本成功', data: { book_id: dto.book_id } };
  }
}
