import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Product, ProductDocument } from "src/schemas/product.schema";
import { Model, Types } from "mongoose";
import { ProductStatus, ShippingStatus } from "src/utils/enum";
import { GetAllProductRequest } from "src/api/user/get-all-product/get-all-product.request";

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


    // Find all products with pagination and filtering
    // async findAllProducts(
    //     getAllProductRequest: GetAllProductRequest,
    //     userId: string,
    //     userRole: string,
    // ) {
    //     // Set default pagination values
    //     const page = getAllProductRequest.page ? parseInt(getAllProductRequest.page.toString()) : 1;
    //     const limit = getAllProductRequest.limit ? parseInt(getAllProductRequest.limit.toString()) : 10;
    //     const skip = (page - 1) * limit;

    //     // Build the query based on filters
    //     const query: any = {};

    //     // Filter by product status if provided
    //     if (getAllProductRequest.productStatus) {
    //         query.productStatus = getAllProductRequest.productStatus;
    //     }

    //     // If role is farmer, only show their own products
    //     if (userRole === 'Farmer') {
    //         query.farmerId = new Types.ObjectId(userId);
    //     }

    //     // If role is buyer, only show products with APPROVED status
    //     if (userRole === 'Buyer') {
    //         query.productStatus = ProductStatus.APPROVED && ProductStatus.ACTIVE;
    //     }

    //     // Prepare sort options
    //     const sortOptions: any = {};
    //     if (getAllProductRequest.sortBy && getAllProductRequest.sortOrder) {
    //         sortOptions[getAllProductRequest.sortBy] = getAllProductRequest.sortOrder === 'asc' ? 1 : -1;
    //     } else {
    //         // Default sorting by createdAt in descending order
    //         sortOptions.createdAt = -1;
    //     }

    //     // Execute count query for pagination info
    //     const totalProducts = await this.productModel.countDocuments(query);
    //     const totalPages = Math.ceil(totalProducts / limit);

    //     // Execute main query with pagination
    //     const products = await this.productModel
    //         .find(query)
    //         .sort(sortOptions)
    //         .skip(skip)
    //         .limit(limit)
    //         .populate('name')
    //         .lean();

    //     // Format the products data
    //     const formattedProducts = products.map(product => {

    //         return {
    //             _id: product._id.toString(),
    //             name: product.name,
    //             description: product.description,
    //             farmerId: product.farmerId._id.toString(),
    //             quantity: product.quantity,
    //             startingPrice: product.startingPrice,
    //             currentHighestBid: product.currentHighestBid,
    //             bidStartDate: product.bidStartDate,
    //             bidEndDate: product.bidEndDate,
    //             bidStartTime: product.bidStartTime,
    //             bidEndTime: product.bidEndTime,
    //             images: product.images,
    //             productStatus: product.productStatus
    //         };
    //     });

    //     // Prepare pagination info
    //     const paginationInfo = {
    //         currentPage: page,
    //         totalPages,
    //         totalProducts,
    //         hasNextPage: page < totalPages,
    //         hasPrevPage: page > 1,
    //     };

    //     return {
    //         count: formattedProducts.length,
    //         pagination: paginationInfo,
    //         products: formattedProducts,
    //     };
    // }


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