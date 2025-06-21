import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BidModeStatus, BidStatus } from 'src/utils/enum';

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

    @Prop({ type: Number, required: true })
    currentBidAmount: number; // Same as bidAmount, but more explicit

    @Prop({ type: Number, default: null })
    previousBidAmount: number | null; // The highest bid before this one

    @Prop({ type: Number, default: null })
    incrementAmount: number | null; // Amount by which this bid increased from previous (null for manual bids)

    @Prop({ type: String, enum: BidModeStatus, default: BidModeStatus.MANUAL })
    bidType: string; // Type of bid - MANUAL or AUTO

}

export const BidSchema = SchemaFactory.createForClass(Bid);