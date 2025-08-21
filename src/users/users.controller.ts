import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/req/update-user.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { User } from './entities/user.entity';
import { UsersResponseDto } from './dto/res/users-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN')
  @Get()
  @ApiOkResponse({ type: UsersResponseDto, isArray: true })
  getAllUsers(): Promise<UsersResponseDto[]> {
    return this.usersService.getAllUsers();
  }

  @Get('profile')
  @ApiOkResponse({ type: UsersResponseDto })
  getUserProfile(@CurrentUser() user: User): Promise<UsersResponseDto> {
    return this.usersService.getUserProfile(user);
  }

  @Patch('profile')
  @ApiOkResponse({ type: UsersResponseDto })
  updateUserProfile(
    @CurrentUser() user: User,
    @Body() body: UpdateUserDto,
  ): Promise<UsersResponseDto> {
    return this.usersService.updateUserProfile(user, body);
  }
}
