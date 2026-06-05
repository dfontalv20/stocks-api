import { IsNotEmpty } from 'class-validator';

export class GetStocksDto {
  @IsNotEmpty()
  search: string;
}
