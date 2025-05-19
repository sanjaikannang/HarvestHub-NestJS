import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BidStatus } from 'src/utils/enum';

export type BidDocument = Bid & Document;

@Schema({ timestamps: true })
export class Bid {

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    bidderId: Types.ObjectId;

    @Prop({ type: Number, required: true })
    bidAmount: number;

    @Prop({ type: Date, required: true })
    bidTime: Date;

    @Prop({ type: Boolean, default: false })
    isWinningBid: boolean;

    @Prop({ type: String, enum: BidStatus, default: BidStatus.ACTIVE })
    bidStatus: BidStatus;

}

export const BidSchema = SchemaFactory.createForClass(Bid);