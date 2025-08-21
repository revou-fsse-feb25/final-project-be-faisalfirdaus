import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TheatersService } from './theaters.service';
import { TheatersListQueryDto } from './dto/req/theaters-list-query.dto';
import { TheaterListItemDto } from './dto/res/theater-list-item.dto';
import { TheaterDetailDto } from './dto/res/theater-detail.dto';
import { StudioDetailDto } from './dto/res/studio-detail.dto';
import { SeatLayoutItemDto } from './dto/res/seat-layout-item.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import {
  CreateTheaterDto,
  UpdateTheaterDto,
} from './dto/req/create-theater.dto';
import { BlockSeatsDto } from './dto/req/block-seats.dto';
import { CreateStudioDto, UpdateStudioDto } from './dto/req/create-studio.dto';

@ApiTags('theaters')
@Controller()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

  @Get('theaters')
  @ApiOkResponse({ type: TheaterListItemDto, isArray: true })
  listTheaters(
    @Query() query: TheatersListQueryDto,
  ): Promise<TheaterListItemDto[]> {
    return this.theatersService.listTheaters(query);
  }

  @Get('theaters/:theaterId')
  @ApiOkResponse({ type: TheaterDetailDto })
  getTheaterById(
    @Param('theaterId') theaterId: string,
  ): Promise<TheaterDetailDto> {
    return this.theatersService.getTheaterById(Number(theaterId));
  }

  @Get('studios/:studioId')
  @ApiOkResponse({ type: StudioDetailDto })
  getStudioById(@Param('studioId') studioId: string): Promise<StudioDetailDto> {
    return this.theatersService.getStudioById(Number(studioId));
  }

  @Get('studios/:studioId/seats')
  @ApiOkResponse({ type: SeatLayoutItemDto, isArray: true })
  getStudioSeatLayout(
    @Param('studioId') studioId: string,
  ): Promise<SeatLayoutItemDto[]> {
    return this.theatersService.getStudioSeatLayout(Number(studioId));
  }

  // ----- Admin: Theaters CRUD -----
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('theaters')
  @ApiOkResponse({ type: TheaterDetailDto })
  createTheater(@Body() body: CreateTheaterDto): Promise<TheaterDetailDto> {
    return this.theatersService.createTheater(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('theaters/:theaterId')
  @ApiOkResponse({ type: TheaterDetailDto })
  updateTheater(
    @Param('theaterId', ParseIntPipe) theaterId: number,
    @Body() body: UpdateTheaterDto,
  ): Promise<TheaterDetailDto> {
    return this.theatersService.updateTheater(theaterId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('theaters/:theaterId')
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  deleteTheater(
    @Param('theaterId', ParseIntPipe) theaterId: number,
  ): Promise<{ deleted: boolean }> {
    return this.theatersService.deleteTheater(theaterId);
  }

  // ----- Admin: Studios CRUD & seat block -----
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('theaters/:theaterId/studios')
  @ApiOkResponse({ type: StudioDetailDto })
  createStudio(
    @Param('theaterId', ParseIntPipe) theaterId: number,
    @Body() body: CreateStudioDto,
  ): Promise<StudioDetailDto> {
    return this.theatersService.createStudio(theaterId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('studios/:studioId')
  @ApiOkResponse({ type: StudioDetailDto })
  updateStudio(
    @Param('studioId', ParseIntPipe) studioId: number,
    @Body() body: UpdateStudioDto,
  ): Promise<StudioDetailDto> {
    return this.theatersService.updateStudio(studioId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('studios/:studioId')
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  deleteStudio(
    @Param('studioId', ParseIntPipe) studioId: number,
  ): Promise<{ deleted: boolean }> {
    return this.theatersService.deleteStudio(studioId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('studios/:studioId/seats/block')
  @ApiOkResponse({ schema: { example: { updated: 12 } } })
  blockSeats(
    @Param('studioId', ParseIntPipe) studioId: number,
    @Body() body: BlockSeatsDto,
  ): Promise<{ updated: number }> {
    return this.theatersService.blockSeats(studioId, body);
  }
}
