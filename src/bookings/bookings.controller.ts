import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateBookingDto } from './dto/req/create-booking.dto';
import { BookingDetailDto } from './dto/res/booking-detail.dto';
import { MyBookingsQueryDto } from './dto/req/my-bookings-query.dto';
import { BookingCancelDto } from './dto/req/booking-cancel.dto';
import { AdminBookingsQueryDto } from './dto/req/admin-bookings-query.dto';
import { UsersBookingsQueryDto } from './dto/req/users-bookings-query.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  @ApiOkResponse({ type: BookingDetailDto })
  createBooking(
    @CurrentUser() user: User,
    @Body() body: CreateBookingDto,
  ): Promise<BookingDetailDto> {
    return this.bookingsService.createBookingHold(user, body);
  }

  @Get('bookings/:bookingReference')
  @ApiOkResponse({ type: BookingDetailDto })
  getBookingByReference(
    @Param('bookingReference') bookingReference: string,
    @CurrentUser() user: User,
  ): Promise<BookingDetailDto> {
    return this.bookingsService.getBookingByReference(user, bookingReference);
  }

  @Get('me/bookings')
  @ApiOkResponse({ type: BookingDetailDto, isArray: true })
  listMyBookings(
    @CurrentUser() user: User,
    @Query() query: MyBookingsQueryDto,
  ): Promise<BookingDetailDto[]> {
    return this.bookingsService.listMyBookings(user, query);
  }

  @Post('bookings/:bookingReference/cancel')
  @ApiOkResponse({ schema: { example: { cancelled: true } } })
  cancelBooking(
    @Param('bookingReference') bookingReference: string,
    @CurrentUser() user: User,
    @Body() body: BookingCancelDto,
  ): Promise<{ cancelled: boolean }> {
    return this.bookingsService.cancelBooking(user, bookingReference, body);
  }

  @Roles('ADMIN')
  @Post('bookings/:bookingReference/claim')
  @ApiOkResponse({ schema: { example: { claimed: true } } })
  claimBooking(
    @Param('bookingReference') bookingReference: string,
  ): Promise<{ claimed: boolean }> {
    return this.bookingsService.claimBooking(bookingReference);
  }

  /** ADMIN: list all bookings (with filters & pagination cursor) */
  @Roles('ADMIN')
  @Get('bookings')
  @ApiOkResponse({ type: BookingDetailDto, isArray: true })
  listAllBookings(
    @Query() query: AdminBookingsQueryDto,
  ): Promise<BookingDetailDto[]> {
    return this.bookingsService.listAllBookings(query);
  }

  /** ADMIN: list bookings for a specific user */
  @Roles('ADMIN')
  @Get('users/:userId/bookings')
  @ApiOkResponse({ type: BookingDetailDto, isArray: true })
  listUserBookings(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: UsersBookingsQueryDto,
  ): Promise<BookingDetailDto[]> {
    return this.bookingsService.listUserBookings(userId, query);
  }
}
