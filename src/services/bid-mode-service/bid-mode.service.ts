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

            // Validate ObjectId format
            if (!Types.ObjectId.isValid(userId)) {
                throw new BadRequestException('Invalid user ID format');
            }
            if (!Types.ObjectId.isValid(productId)) {
                throw new BadRequestException('Invalid product ID format');
            }

            // Validate product exists
            const product = await this.productRepositoryService.findProductById(productId);

            if (!product) {
                throw new BadRequestException('Product not found');
            }

            // Validate auto increment amount for AUTO mode
            if (bidMode === BidModeStatus.AUTO) {
                if (!autoIncrementAmount || autoIncrementAmount <= 0) {
                    throw new BadRequestException('Auto increment amount must be greater than 0 for automatic bidding');
                }
            }

            // For MANUAL mode, autoIncrementAmount should not be provided or should be undefined
            if (bidMode === BidModeStatus.MANUAL && autoIncrementAmount !== undefined) {
                throw new BadRequestException('Auto increment amount should not be provided for manual bidding');
            }

            // Convert string IDs to ObjectId
            const userObjectId = new Types.ObjectId(userId);
            const productObjectId = new Types.ObjectId(productId);

            // Check if bid mode already exists for this user-product combination
            const existingBidMode = await this.bidModeRepositoryService.findBidMode({
                userId: userObjectId,
                productId: productObjectId
            });

            let bidModeResult;

            if (existingBidMode) {
                // Update existing bid mode
                if (bidMode === BidModeStatus.AUTO) {
                    // For AUTO mode, set the autoIncrementAmount
                    const updateData = {
                        bidMode,
                        autoIncrementAmount: autoIncrementAmount,
                        updatedAt: new Date()
                    };

                    bidModeResult = await this.bidModeRepositoryService.updateBidMode(
                        existingBidMode._id as Types.ObjectId,
                        updateData
                    );
                } else {
                    // For MANUAL mode, explicitly unset autoIncrementAmount
                    bidModeResult = await this.bidModeRepositoryService.updateBidModeWithUnset(
                        existingBidMode._id as Types.ObjectId,
                        {
                            bidMode,
                            // updatedAt: new Date()
                        },
                        ['autoIncrementAmount'] // Fields to unset
                    );
                }
            } else {
                // Create new bid mode
                const newBidModeData: any = {
                    userId: userObjectId,
                    productId: productObjectId,
                    bidMode,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Set autoIncrementAmount only for AUTO mode
                if (bidMode === BidModeStatus.AUTO) {
                    newBidModeData.autoIncrementAmount = autoIncrementAmount;
                }

                bidModeResult = await this.bidModeRepositoryService.createBidMode(newBidModeData);
            }

            // Check if bidModeResult is null or undefined
            if (!bidModeResult) {
                throw new BadRequestException('Failed to create or update bid mode');
            }

            const response: SetBidModeResponse = {
                message: "Bid mode set successfully",
                bidMode: {
                    userId: bidModeResult.userId.toString(),
                    productId: bidModeResult.productId.toString(),
                    bidMode: bidModeResult.bidMode,
                    autoIncrementAmount: bidModeResult.autoIncrementAmount ? Number(bidModeResult.autoIncrementAmount) : undefined
                }
            };

            return response;

        } catch (error) {
            console.error('Error setting bid mode:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to set bid mode: ${error.message}`);
        }
    }


    // Get Bid Mode for a specific product and user
    async getBidMode(userId: string, productId: string): Promise<GetBidModeResponse> {
        try {

            // Validate ObjectId format
            if (!Types.ObjectId.isValid(userId)) {
                throw new BadRequestException('Invalid user ID format');
            }
            if (!Types.ObjectId.isValid(productId)) {
                throw new BadRequestException('Invalid product ID format');
            }

            // Convert string IDs to ObjectId
            const userObjectId = new Types.ObjectId(userId);
            const productObjectId = new Types.ObjectId(productId);

            // Find existing bid mode
            const bidMode = await this.bidModeRepositoryService.findBidMode({
                userId: userObjectId,
                productId: productObjectId
            });

            if (!bidMode) {
                return {
                    message: "No bid mode set for this product. Default to manual bidding.",
                    bidMode: undefined
                };
            }

            const response: GetBidModeResponse = {
                message: "Bid mode retrieved successfully",
                bidMode: {
                    userId: bidMode.userId.toString(),
                    productId: bidMode.productId.toString(),
                    bidMode: bidMode.bidMode,
                    autoIncrementAmount: bidMode.autoIncrementAmount !== undefined && bidMode.autoIncrementAmount !== null
                        ? Number(bidMode.autoIncrementAmount)
                        : undefined
                }
            };

            return response;

        } catch (error) {
            console.error('Error getting bid mode:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to get bid mode: ${error.message}`);
        }
    }


}
