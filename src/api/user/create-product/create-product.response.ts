import { ProductStatus, ShippingStatus } from 'src/utils/enum';
import { Types } from 'mongoose';

export class CreateProductResponse {

    message: string;

    product: {
        id: string;
        name: string;
        description: string;
        farmerId: Types.ObjectId;
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
    };

}