import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { CreateBookingDto } from './dto/req/create-booking.dto';
import { BookingDetailDto } from './dto/res/booking-detail.dto';
import { BookingSummaryDto } from './dto/res/booking-summary.dto';
import { ListBookingsQueryDto } from './dto/req/list-bookings-query.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /v1/bookings
   * Body: { showtimeId: number, seatIds: number[] }
   * Auth required.
   * Optional Idempotency-Key header supported.
   *
   * Creates a Pending booking (hold) + booking_seats line items
   * with price_cents copied from showtimes.price at booking time.
   *
   * Business rules enforced in the service:
   * - Seats must belong to the showtime’s studio and not be blocked.
   * - Prevent double-booking (unique on {showtime_id, seat_id}).
   */
  @Post()
  @ApiOkResponse({ type: BookingDetailDto })
  async createBooking(
    @CurrentUser() user: { sub: number; email: string },
    @Body() dto: CreateBookingDto,
    @Headers('Idempotency-Key') idempotencyKey?: string,
  ): Promise<BookingDetailDto> {
    return this.bookingsService.createPendingBooking({
      userId: user.sub,
      showtimeId: dto.showtimeId,
      seatIds: dto.seatIds,
      idempotencyKey,
    });
  }

  /**
   * GET /v1/bookings
   * Auth required. Filter by booking_status (optional).
   */
  @Get()
  @ApiOkResponse({ type: BookingSummaryDto, isArray: true })
  async listMyBookings(
    @CurrentUser() user: { sub: number },
    @Query() query: ListBookingsQueryDto,
  ): Promise<BookingSummaryDto[]> {
    return this.bookingsService.listUserBookings(user.sub, query);
  }

  /**
   * GET /v1/bookings/:bookingId
   * Auth required. Returns booking header + seats + payment summary.
   */
  @Get(':bookingId')
  @ApiOkResponse({ type: BookingDetailDto })
  async getBookingDetail(
    @CurrentUser() user: { sub: number },
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<BookingDetailDto> {
    return this.bookingsService.getBookingDetail(user.sub, bookingId);
  }

  /**
   * PATCH /v1/bookings/:bookingId/cancel
   * Auth required. Sets booking_status = Cancelled (frees seats).
   */
  @Patch(':bookingId/cancel')
  @ApiOkResponse({ type: BookingDetailDto })
  async cancelBooking(
    @CurrentUser() user: { sub: number },
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<BookingDetailDto> {
    return this.bookingsService.cancelBooking(user.sub, bookingId);
  }

  /**
   * PATCH /v1/bookings/:bookingId/confirm
   * Auth required (can also be called internally after payment success).
   * Sets booking_status = Confirmed.
   */
  @Patch(':bookingId/confirm')
  @ApiOkResponse({ type: BookingDetailDto })
  async confirmBooking(
    @CurrentUser() user: { sub: number },
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<BookingDetailDto> {
    return this.bookingsService.confirmBooking(user.sub, bookingId);
  }
}
