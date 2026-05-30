import { IsNumber, IsBoolean } from 'class-validator';

/**
 * 位置上报/更新 DTO
 * 用于 POST /map/location 接口
 */
export class UpdateLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsBoolean()
  isSharing: boolean;
}
