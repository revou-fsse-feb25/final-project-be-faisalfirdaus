import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
// import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ShowtimesService } from './showtimes.service';
import { ShowtimeDetailDto } from './dto/res/showtime-detail.dto';
import { ShowtimeSeatAvailabilityDto } from './dto/res/showtime-seat-availability.dto';

// @ApiTags('showtimes')
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

  /**
   * GET /v1/showtimes/:showtimeId
   * Return detail (movie, theater, studio, price, is_active)
   */
  @Get(':showtimeId')
  // @ApiOkResponse({ type: ShowtimeDetailDto })
  async getShowtimeDetail(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
  ): Promise<ShowtimeDetailDto> {
    return this.showtimesService.getShowtimeDetail(showtimeId);
  }

  /**
   * GET /v1/showtimes/:showtimeId/seats
   * Live availability for a showtime
   */
  @Get(':showtimeId/seats')
  // @ApiOkResponse({ type: ShowtimeSeatAvailabilityDto, isArray: true })
  async getShowtimeSeatAvailability(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
  ): Promise<ShowtimeSeatAvailabilityDto[]> {
    return this.showtimesService.getShowtimeSeatAvailability(showtimeId);
  }
}
