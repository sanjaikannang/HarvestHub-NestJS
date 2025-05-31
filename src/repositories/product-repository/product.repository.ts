import { Injectable, NotFoundException } from "@nestjs/common";
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


    // Find a specific product by ID
    async findProductById(productId: string) {

        const result = await this.productModel.findById(productId).exec();

        return result;
    }


    // Update the product status and admin feedback
    async reviewProduct(
        productId: string,
        status: ProductStatus,
        adminFeedback: string,
        adminId: string
    ): Promise<Product | null> {
        try {
            // Only update if product is in PENDING state
            const updateResult = await this.productModel.findOneAndUpdate(
                {
                    _id: new Types.ObjectId(productId),
                    productStatus: ProductStatus.PENDING  // This ensures we only update products in PENDING state
                },
                {
                    productStatus: status,
                    adminFeedback: adminFeedback,
                    reviewedBy: new Types.ObjectId(adminId),
                    reviewedAt: new Date()
                },
                { new: true }
            ).exec();

            return updateResult;

        } catch (error) {
            throw new Error(`Error reviewing product: ${error.message}`);
        }
    }


    // Find Products by Farmer ID
    async findProductsByFarmerId(farmerId: Types.ObjectId): Promise<ProductDocument[]> {
        return this.productModel.find({ farmerId }).exec();
    }


    // Find Product By Buyer ID
    async findProductsByHighestBidderId(bidderId: Types.ObjectId): Promise<ProductDocument[]> {
        return this.productModel.find({ currentHighestBidderId: bidderId }).exec();
    }


    // Delete Product
    async deleteProduct(productId: string): Promise<ProductDocument> {
        if (!Types.ObjectId.isValid(productId)) {
            throw new NotFoundException('Invalid product ID');
        }

        const deletedProduct = await this.productModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        return deletedProduct;
    }


    // Update Product
    async updateProduct(
        productId: string,
        updateData: Partial<{
            name: string;
            description: string;
            quantity: { value: number; unit: string };
            startingPrice: number;
            bidStartDate: Date;
            bidEndDate: Date;
            bidStartTime: Date;
            bidEndTime: Date;
            images: string[];
            currentHighestBid: number;
            currentHighestBidderId: Types.ObjectId;
            productStatus: any;
            adminFeedback: string;
            reviewedBy: Types.ObjectId;
            reviewedAt: Date;
            shippingStatus: any;
            trackingDetails: {
                carrier: string;
                trackingNumber: string;
                estimatedDelivery: Date;
            };
        }>
    ): Promise<ProductDocument | null> {
        try {
            return await this.productModel.findByIdAndUpdate(
                new Types.ObjectId(productId),
                { $set: updateData },
                {
                    new: true, // Return the updated document
                    runValidators: true // Run schema validations
                }
            ).exec();
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    }


    // Update multiple products
    async updateMultipleProducts(
        filter: any,
        updateData: any
    ): Promise<{ matchedCount: number; modifiedCount: number }> {
        try {
            const result = await this.productModel.updateMany(
                filter,
                { $set: updateData },
                { runValidators: true }
            ).exec();

            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            console.error('Error updating multiple products:', error);
            throw new Error('Failed to update multiple products');
        }
    }


    // Increment current highest bid
    async incrementHighestBid(productId: string, bidAmount: number, bidderId: Types.ObjectId): Promise<ProductDocument | null> {
        try {
            return await this.productModel.findByIdAndUpdate(
                new Types.ObjectId(productId),
                {
                    $set: {
                        currentHighestBid: bidAmount,
                        currentHighestBidderId: bidderId
                    }
                },
                { new: true, runValidators: true }
            ).exec();
        } catch (error) {
            console.error('Error incrementing highest bid:', error);
            throw new Error('Failed to increment highest bid');
        }
    }

}