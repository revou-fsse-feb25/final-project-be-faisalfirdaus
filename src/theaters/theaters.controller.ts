import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
// import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TheatersService } from './theaters.service';
import { TheatersListQueryDto } from './dto/req/theaters-list-query.dto';
import { TheaterListItemDto } from './dto/res/theater-list-item.dto';
import { TheaterDetailDto } from './dto/res/theater-detail.dto';
import { StudioDetailDto } from './dto/res/studio-detail.dto';
import { SeatLayoutItemDto } from './dto/res/seat-layout-item.dto';

// @ApiTags('theaters')
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

  /**
   * GET /v1/theaters?city=Jakarta
   */
  @Get('theaters')
  // @ApiOkResponse({ type: TheaterListItemDto, isArray: true })
  async listTheaters(
    @Query() query: TheatersListQueryDto,
  ): Promise<TheaterListItemDto[]> {
    return this.theatersService.listTheaters(query);
  }

  /**
   * GET /v1/theaters/:theaterId
   */
  @Get('theaters/:theaterId')
  // @ApiOkResponse({ type: TheaterDetailDto })
  async getTheaterById(
    @Param('theaterId') theaterId: string,
  ): Promise<TheaterDetailDto> {
    return this.theatersService.getTheaterById(Number(theaterId));
  }

  /**
   * GET /v1/studios/:studioId
   */
  @Get('studios/:studioId')
  // @ApiOkResponse({ type: StudioDetailDto })
  async getStudioById(
    @Param('studioId') studioId: string,
  ): Promise<StudioDetailDto> {
    return this.theatersService.getStudioById(Number(studioId));
  }

  /**
   * GET /v1/studios/:studioId/seats
   * Static seat map (layout only) — cacheable on client
   */
  @Get('studios/:studioId/seats')
  // @ApiOkResponse({ type: SeatLayoutItemDto, isArray: true })
  async getStudioSeatLayout(
    @Param('studioId') studioId: string,
  ): Promise<SeatLayoutItemDto[]> {
    return this.theatersService.getStudioSeatLayout(Number(studioId));
  }
}
