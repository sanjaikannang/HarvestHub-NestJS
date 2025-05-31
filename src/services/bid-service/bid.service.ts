import { Injectable } from "@nestjs/common";
import { BidRepositoryService } from "src/repositories/bid-repository/bid.repository";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";
import { UserRepositoryService } from "src/repositories/user-repository/user.repository";
import { BidStatus } from "src/utils/enum";
import { Types } from 'mongoose';

interface PlaceBidParams {
    productId: string;
    bidderId: string;
    bidAmount: number;
    bidTime: Date;
}

interface BidResult {
    success?: boolean;
    error?: string;
    bid?: any;
    _id?: string;
    productId?: string;
    bidderId?: string;
    bidAmount?: number;
    bidTime?: Date;
    isWinningBid?: boolean;
    bidStatus?: BidStatus;
}

interface AuctionState {
    productId: string;
    productName: string;
    description: string;
    startingPrice: number;
    currentHighestBid: number;
    currentHighestBidderId: string | null;
    currentHighestBidderName: string | null;
    bidStartDate: Date;
    bidEndDate: Date;
    bidStartTime: Date;
    bidEndTime: Date;
    isActive: boolean;
    totalBids: number;
    recentBids: Array<{
        bidderId: string;
        bidderName: string;
        bidAmount: number;
        bidTime: Date;
    }>;
}


@Injectable()
export class BidService {

    constructor(
        private readonly productRepositoryService: ProductRepositoryService,
        private readonly userRepositoryService: UserRepositoryService,
        private readonly bidRepositoryService: BidRepositoryService
    ) { }


    // Place Bid Method
    async placeBid(params: PlaceBidParams): Promise<BidResult> {
        try {

            const { productId, bidderId, bidAmount, bidTime } = params;

            // Convert string IDs to ObjectId
            const productObjectId = new Types.ObjectId(productId);
            const bidderObjectId = new Types.ObjectId(bidderId);

            // Validate product exists
            const product = await this.productRepositoryService.findProductById(productId);
            if (!product) {
                return { error: "Product not found" };
            }

            // Check if auction is active
            const now = new Date();
            if (now < product.bidStartDate || now > product.bidEndDate) {
                return { error: "Auction is not currently active" };
            }

            // Check if bid amount is higher than current highest bid
            const minimumBid = product.currentHighestBid || product.startingPrice;
            if (bidAmount <= minimumBid) {
                return {
                    error: `Bid amount must be higher than current highest bid of $${minimumBid}`
                };
            }

            // Check if user is not the owner of the product
            if (product.farmerId.toString() === bidderId) {
                return { error: "Product owner cannot bid on their own product" };
            }

            // Check if user already has the highest bid
            if (product.currentHighestBidderId &&
                product.currentHighestBidderId.toString() === bidderId) {
                return { error: "You already have the highest bid" };
            }

            // Create new bid
            const newBidData = {
                productId: productObjectId,
                bidderId: bidderObjectId,
                bidAmount,
                bidTime,
                isWinningBid: true, // This will be the new winning bid
                bidStatus: BidStatus.ACTIVE,
            };

            const createdBid = await this.bidRepositoryService.createBid(newBidData);

            // Update previous winning bid (if any)
            if (product.currentHighestBidderId) {
                await this.bidRepositoryService.updatePreviousWinningBids(
                    productId,
                    product.currentHighestBidderId.toString()
                );
            }

            // Update product with new highest bid
            await this.productRepositoryService.updateProduct(productId, {
                currentHighestBid: bidAmount,
                currentHighestBidderId: bidderObjectId,
            });

            return {
                success: true,
                bid: createdBid,
                _id: (createdBid._id as Types.ObjectId).toString(),
                productId: createdBid.productId.toString(),
                bidderId: createdBid.bidderId.toString(),
                bidAmount: createdBid.bidAmount,
                bidTime: createdBid.bidTime,
                isWinningBid: createdBid.isWinningBid,
                bidStatus: createdBid.bidStatus,
            };

        } catch (error) {
            console.error('Error placing bid:', error);
            return { error: "Failed to place bid. Please try again." };
        }
    }

    async getAuctionState(productId: string): Promise<AuctionState> {
        try {
            // Get product details
            const product = await this.productRepositoryService.findProductById(productId);
            if (!product) {
                throw new Error("Product not found");
            }

            // Get current highest bidder details
            let currentHighestBidderName: string | null = null;
            if (product.currentHighestBidderId) {
                const bidder = await this.userRepositoryService.findById(
                    product.currentHighestBidderId.toString()
                );
                currentHighestBidderName = bidder?.name ?? "Unknown";
            }

            // Get recent bids (last 10 bids)
            const recentBids = await this.bidRepositoryService.getRecentBidsByProductId(
                productId,
                10
            );

            // Get bidder names for recent bids
            const recentBidsWithNames = await Promise.all(
                recentBids.map(async (bid) => {
                    const bidder = await this.userRepositoryService.findById(
                        bid.bidderId.toString()
                    );
                    return {
                        bidderId: bid.bidderId.toString(),
                        bidderName: bidder?.name || "Unknown",
                        bidAmount: bid.bidAmount,
                        bidTime: bid.bidTime,
                    };
                })
            );

            // Get total bid count
            const totalBids = await this.bidRepositoryService.countBidsByProductId(productId);

            // Check if auction is currently active
            const now = new Date();
            const isActive = now >= product.bidStartDate && now <= product.bidEndDate;

            return {
                productId: (product._id as Types.ObjectId).toString(),
                productName: product.name,
                description: product.description,
                startingPrice: product.startingPrice,
                currentHighestBid: product.currentHighestBid || product.startingPrice,
                currentHighestBidderId: product.currentHighestBidderId?.toString() || null,
                currentHighestBidderName,
                bidStartDate: product.bidStartDate,
                bidEndDate: product.bidEndDate,
                bidStartTime: product.bidStartTime,
                bidEndTime: product.bidEndTime,
                isActive,
                totalBids,
                recentBids: recentBidsWithNames,
            };

        } catch (error) {
            console.error('Error getting auction state:', error);
            throw new Error("Failed to get auction state");
        }
    }

    // Helper method to check if auction has ended and finalize winning bid
    async finalizeAuction(productId: string): Promise<void> {
        try {
            const product = await this.productRepositoryService.findProductById(productId);
            if (!product) {
                throw new Error("Product not found");
            }

            const now = new Date();
            if (now <= product.bidEndDate) {
                throw new Error("Auction has not ended yet");
            }

            // Mark all non-winning bids as closed
            await this.bidRepositoryService.closeNonWinningBids(productId);

            // Update product status if needed (you might want to add this logic)
            // await this.productRepositoryService.updateProduct(productId, {
            //     productStatus: ProductStatus.SOLD
            // });

        } catch (error) {
            console.error('Error finalizing auction:', error);
            throw error;
        }
    }


}