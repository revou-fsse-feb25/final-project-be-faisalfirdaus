import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BlockSpec {
  @ApiProperty() @IsString() row: string;
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  numbers: number[];
}

export class BlockSeatsDto {
  @ApiProperty({ type: [BlockSpec] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockSpec)
  blocks: BlockSpec[];
  @ApiProperty() @IsBoolean() isBlocked: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() reason?: string;
}
