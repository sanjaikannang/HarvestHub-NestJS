import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Product, ProductDocument } from "src/schemas/product.schema";
import { Model, Types } from "mongoose";
import { ProductStatus, ShippingStatus } from "src/utils/enum";

@Injectable()
export class ProductRepositoryService {

    constructor(
        @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>
    ) { }


    // Create a new product
    async createProduct(productData: {
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
    }): Promise<ProductDocument> {
        const newProduct = new this.productModel({
            ...productData,
            productStatus: ProductStatus.PENDING,
            shippingStatus: ShippingStatus.NOT_SHIPPED,
            currentHighestBid: productData.startingPrice,
        });

        return await newProduct.save();
    }
    

    // Count Product
    async countProducts(query: any): Promise<number> {
        return await this.productModel.countDocuments(query);
    }


    // Find Product
    async findProducts(
        query: any,
        skip: number,
        limit: number
    ) {
        // Execute count query for pagination info
        const totalProducts = await this.productModel.countDocuments(query);

        // Execute main query with pagination
        const products = await this.productModel
            .find(query)
            .skip(skip)
            .limit(limit)
            .populate('name')
            .lean();

        // Return raw data to be processed by service layer
        return {
            totalProducts,
            products
        };
    }

}