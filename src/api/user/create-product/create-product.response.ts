import { Schema as MongooseSchema } from 'mongoose';
import { ProductStatus, ShippingStatus } from 'src/utils/enum';


export class CreateProductResponse {

    message: string;

    product: {
        id: string;
        name: string;
        description: string;
        farmerId: MongooseSchema.Types.ObjectId;
        quantity: {
            value: number;
            unit: string;
        };
        images: string[];
        startingPrice: number;
        bidStartDate: Date;
        bidEndDate: Date;
        bidStartTime: Date;
        bidEndTime: Date;
        status: ProductStatus;
        shippingStatus: ShippingStatus;
        createdAt: Date;
    };

}