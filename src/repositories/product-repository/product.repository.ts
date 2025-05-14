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


    // Create a new productW
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


    // Count total number of products matching the filter
    async countProducts(filter: any): Promise<number> {
        return this.productModel.countDocuments(filter);
    }


    // Find products with pagination
    async findProducts(
        filter: any,
        skip: number,
        limit: number,
        sort: any = { createdAt: -1 }
    ): Promise<ProductDocument[]> {
        return this.productModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();
    }


    // Build filter object for product queries
    buildProductFilter(
        status?: ProductStatus,
        search?: string,
        userRole?: string
    ): any {
        const filter: any = {};

        // Apply status filter based on user role
        if (userRole !== 'ADMIN') {
            // For non-admin users, only show APPROVED products
            filter.productStatus = ProductStatus.APPROVED;
        } else if (status) {
            // For admin users, apply status filter if provided
            filter.productStatus = status;
        }

        // Add text search
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        return filter;
    }


    // Find product by ID
    async findProductById(productId: string): Promise<ProductDocument | null> {
        return this.productModel.findById(productId).lean();
    }


    // Find products by farmer ID
    async findProductsByFarmerId(farmerId: string): Promise<ProductDocument[]> {
        return this.productModel
            .find({ farmerId: new Types.ObjectId(farmerId) })
            .lean();
    }


    // Create pagination information
    createPaginationInfo(currentPage: number, limit: number, totalProducts: number): any {
        const totalPages = Math.ceil(totalProducts / limit);

        return {
            currentPage,
            totalPages,
            totalProducts,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
        };
    }

}