import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductStatus, ShippingStatus } from 'src/utils/enum';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {

    @Prop()
    name: string;

    @Prop()
    description: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    farmerId: Types.ObjectId;

    @Prop({
        type: {
            value: { type: Number, required: true },
            unit: { type: String, required: true },
        },
        required: true,
    })
    quantity: {
        value: number;
        unit: string;
    };

    @Prop({ required: true })
    startingPrice: number;

    @Prop()
    bidStartDate: Date;

    @Prop()
    bidEndDate: Date;

    @Prop()
    bidStartTime: Date;

    @Prop()
    bidEndTime: Date;

    @Prop([String])
    images: string[];

    @Prop()
    currentHighestBid: number;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    currentHighestBidderId: Types.ObjectId;

    @Prop({ enum: ProductStatus, default: ProductStatus.PENDING })
    productStatus: ProductStatus;

    @Prop()
    adminFeedback: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    reviewedBy: Types.ObjectId;

    @Prop()
    reviewedAt: Date;

    @Prop({ enum: ShippingStatus, default: ShippingStatus.NOT_SHIPPED })
    shippingStatus: ShippingStatus;

    @Prop({
        type: {
            carrier: String,
            trackingNumber: String,
            estimatedDelivery: Date,
        },
        _id: false,
    })
    trackingDetails: {
        carrier: string;
        trackingNumber: string;
        estimatedDelivery: Date;
    };

}

export const ProductSchema = SchemaFactory.createForClass(Product);