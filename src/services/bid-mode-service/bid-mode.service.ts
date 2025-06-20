import { BadRequestException, Injectable } from "@nestjs/common";
import { SetBidModeResponse } from "src/api/bid/set-bid-mode/set-bid-mode.response";
import { Types } from 'mongoose';
import { BidModeStatus } from "src/utils/enum";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";
import { BidModeRepositoryService } from "src/repositories/bid-mode-repository/bid-mode-repository";
import { GetBidModeResponse } from "src/api/bid/get-bid-mode/get-bid-mode.response";

@Injectable()
export class BidModeService {

    constructor(
        private readonly productRepositoryService: ProductRepositoryService,
        private readonly bidModeRepositoryService: BidModeRepositoryService,
    ) { }


    // Set Bid Mode for a specific product and user
    async setBidMode(params: {
        userId: string,
        productId: string,
        bidMode: BidModeStatus,
        autoIncrementAmount?: number
    }): Promise<SetBidModeResponse> {
        try {
            const { userId, productId, bidMode, autoIncrementAmount } = params;

            // Validate product exists
            const product = await this.productRepositoryService.findProductById(productId);
            if (!product) {
                throw new BadRequestException('Product not found');
            }

            // Validate auto increment amount for AUTO mode
            if (bidMode === BidModeStatus.AUTO && (!autoIncrementAmount || autoIncrementAmount <= 0)) {
                throw new BadRequestException('Auto increment amount must be greater than 0 for automatic bidding');
            }

            // Convert string IDs to ObjectId
            const userObjectId = new Types.ObjectId(userId);
            const productObjectId = new Types.ObjectId(productId);

            // Check if bid mode already exists for this user-product combination
            // const existingBidMode = await this.bidModeRepositoryService.findBidMode({
            //     userId: userObjectId,
            //     productId: productObjectId
            // });

            let bidModeResult;

            // if (existingBidMode) {
            // Update existing bid mode
            // bidModeResult = await this.bidModeRepositoryService.updateBidMode(
            //     existingBidMode._id.toString(),
            //     {
            //         bidMode,
            //         autoIncrementAmount: bidMode === BidModeStatus.AUTO ? autoIncrementAmount : undefined,
            //         updatedAt: new Date()
            //     }
            // );
            // } else {
            //     // Create new bid mode
            //     const newBidModeData = {
            //         userId: userObjectId,
            //         productId: productObjectId,
            //         bidMode,
            //         autoIncrementAmount: bidMode === BidModeStatus.AUTO ? autoIncrementAmount : undefined,
            //         createdAt: new Date(),
            //         updatedAt: new Date()
            //     };

            //     bidModeResult = await this.bidModeRepositoryService.createBidMode(newBidModeData);
            // }

            const response: SetBidModeResponse = {
                message: "Bid mode set successfully",
                bidMode: {
                    userId: bidModeResult.userId.toString(),
                    productId: bidModeResult.productId.toString(),
                    bidMode: bidModeResult.bidMode,
                    autoIncrementAmount: bidModeResult.autoIncrementAmount,
                    createdAt: bidModeResult.createdAt,
                    updatedAt: bidModeResult.updatedAt
                }
            };

            return response;

        } catch (error) {
            console.error('Error setting bid mode:', error);
            throw new BadRequestException(`Failed to set bid mode. ${error.message}`);
        }
    }

    // Get Bid Mode for a specific product and user
    async getBidMode(userId: string, productId: string): Promise<GetBidModeResponse> {
        try {
            // Convert string IDs to ObjectId
            const userObjectId = new Types.ObjectId(userId);
            const productObjectId = new Types.ObjectId(productId);

            // Find existing bid mode
            // const bidMode = await this.bidModeRepositoryService.findBidMode({
            //     userId: userObjectId,
            //     productId: productObjectId
            // });

            // if (!bidMode) {
            //     return {
            //         message: "No bid mode set for this product. Default to manual bidding.",
            //         bidMode: undefined
            //     };
            // }

            const response: GetBidModeResponse = {
                message: "Bid mode retrieved successfully",
                // bidMode: {
                //     userId: bidMode.userId.toString(),
                //     productId: bidMode.productId.toString(),
                //     bidMode: bidMode.bidMode,
                //     autoIncrementAmount: bidMode.autoIncrementAmount,
                //     createdAt: bidMode.createdAt,
                //     updatedAt: bidMode.updatedAt
                // }
            };

            return response;

        } catch (error) {
            console.error('Error getting bid mode:', error);
            throw new BadRequestException(`Failed to get bid mode. ${error.message}`);
        }
    }


}
