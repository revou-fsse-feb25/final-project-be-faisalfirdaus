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
import { ShowtimesService } from './showtimes.service';
import { ShowtimeDetailDto } from './dto/res/showtime-detail.dto';
import { ShowtimeSeatAvailabilityDto } from './dto/res/showtime-seat-availability.dto';
import { ShowtimesListQueryDto } from './dto/req/showtimes-list-query.dto';
import {
  CreateShowtimeDto,
  UpdateShowtimeDto,
} from './dto/req/create-showtime.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';

@ApiTags('showtimes')
@Controller('showtimes')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Get()
  @ApiOkResponse({ schema: { example: { items: [], nextCursor: null } } })
  listShowtimes(@Query() query: ShowtimesListQueryDto): Promise<any> {
    return this.showtimesService.listShowtimes(query);
  }

  @Get(':showtimeId')
  @ApiOkResponse({ type: ShowtimeDetailDto })
  getShowtimeDetail(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
  ): Promise<ShowtimeDetailDto> {
    return this.showtimesService.getShowtimeDetail(showtimeId);
  }

  @Get(':showtimeId/seats')
  @ApiOkResponse({ type: ShowtimeSeatAvailabilityDto, isArray: true })
  getShowtimeSeatAvailability(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
  ): Promise<ShowtimeSeatAvailabilityDto[]> {
    return this.showtimesService.getShowtimeSeatAvailability(showtimeId);
  }

  // Admin CRUD
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiOkResponse({ type: ShowtimeDetailDto })
  createShowtime(@Body() body: CreateShowtimeDto): Promise<ShowtimeDetailDto> {
    return this.showtimesService.createShowtime(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':showtimeId')
  @ApiOkResponse({ type: ShowtimeDetailDto })
  updateShowtime(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
    @Body() body: UpdateShowtimeDto,
  ): Promise<ShowtimeDetailDto> {
    return this.showtimesService.updateShowtime(showtimeId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':showtimeId')
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  deleteShowtime(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
  ): Promise<{ deleted: boolean }> {
    return this.showtimesService.deleteShowtime(showtimeId);
  }
}
