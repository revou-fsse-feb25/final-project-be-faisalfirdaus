// src/theaters/dto/res/seat-layout-item.dto.ts
// import { ApiProperty } from '';

export class SeatLayoutItemDto {
  seat_id!: string;
  row_letter!: string; // e.g., "A"
  seat_number!: number; // e.g., 12
  is_blocked!: boolean; // static layout flag
}
