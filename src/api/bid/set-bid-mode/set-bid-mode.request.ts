import { IsNotEmpty, IsEnum, IsNumber, ValidateIf } from "class-validator";
import { BidModeStatus } from "src/utils/enum";

export class SetBidModeRequest {

    @IsEnum(BidModeStatus)
    @IsNotEmpty()
    bidMode: BidModeStatus;

    // Required only for AUTO bidding mode
    @ValidateIf(o => o.bidMode === BidModeStatus.AUTO)
    @IsNumber()
    @IsNotEmpty()
    autoIncrementAmount?: number;

}