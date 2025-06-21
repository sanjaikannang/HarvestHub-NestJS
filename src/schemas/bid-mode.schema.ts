import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BidModeStatus } from 'src/utils/enum';

export type BidModeDocument = BidMode & Document;

@Schema({ timestamps: true })
export class BidMode {

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: String, enum: BidModeStatus, default: BidModeStatus.MANUAL })
    bidMode: BidModeStatus;

    @Prop({ type: Number, required: false })
    autoIncrementAmount?: Number

}

export const BidModeSchema = SchemaFactory.createForClass(BidMode);

BidModeSchema.index({ userId: 1, productId: 1 }, { unique: true });