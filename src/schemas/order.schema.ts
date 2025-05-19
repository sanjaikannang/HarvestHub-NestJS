import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus, ShippingStatus } from 'src/utils/enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    buyerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    farmerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Bid', required: true })
    bidId: Types.ObjectId;

    @Prop({ type: Number, required: true })
    orderAmount: number;

    @Prop({
        type: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            zipCode: { type: String, required: true },
        },
        required: true
    })
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
    orderStatus: OrderStatus;

    @Prop({ type: Types.ObjectId, ref: 'Payment' })
    paymentId: Types.ObjectId;

    @Prop({ type: String, enum: ShippingStatus, default: ShippingStatus.NOT_SHIPPED })
    shippingStatus: ShippingStatus;

    @Prop({
        type: {
            carrier: { type: String },
            trackingNumber: { type: String },
            estimatedDelivery: { type: Date },
            actualDelivery: { type: Date },
        },
        _id: false,
        default: {}
    })
    trackingDetails: {
        carrier?: string;
        trackingNumber?: string;
        estimatedDelivery?: Date;
        actualDelivery?: Date;
    };

    @Prop({ type: String })
    orderNotes: string;

}

export const OrderSchema = SchemaFactory.createForClass(Order);