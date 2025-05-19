import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus, PayoutStatus } from 'src/utils/enum';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {

    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    orderId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    buyerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    farmerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Number, required: true })
    amount: number;

    @Prop({ type: String, default: 'INR' })
    currency: string;

    @Prop({ type: String })
    razorpayPaymentId: string;

    @Prop({ type: String })
    razorpayOrderId: string;

    @Prop({ type: String })
    razorpaySignature: string;

    @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: string;

    @Prop({ type: String })
    paymentMethod: string;

    @Prop({ type: Number, default: 0 })
    transactionFee: number;

    @Prop({ type: Number, default: 0 })
    farmerPayout: number;

    @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.PENDING })
    payoutStatus: string;

    @Prop({ type: String })
    payoutId: string;

}

export const PaymentSchema = SchemaFactory.createForClass(Payment);