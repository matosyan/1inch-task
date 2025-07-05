import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNumber } from 'class-validator';

export class CoordinatesDto {
  @ApiProperty({ type: Number, required: true })
  @IsDefined()
  @IsNumber()
  latitude: number;

  @ApiProperty({ type: Number, required: true })
  @IsDefined()
  @IsNumber()
  longitude: number;
}
