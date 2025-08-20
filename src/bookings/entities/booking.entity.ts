export class Booking {
  id: string;
  user_Id: string;
  showtime_Id: string;
  booking_datet: Date;
  booking_status: 'PENDING' | 'CONFIRMED' | 'CLAIMED' | 'CANCELLED' | 'EXPIRED';
}
