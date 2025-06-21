import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { BidRepositoryService } from "src/repositories/bid-repository/bid.repository";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";
import { BidModeStatus, BidStatus, ProductStatus } from "src/utils/enum";
import { Types } from 'mongoose';
import { PlaceBidResponse } from "src/api/bid/place-bid/place-bid.response";
import { UserRepositoryService } from "src/repositories/user-repository/user.repository";
import { BidModeRepositoryService } from "src/repositories/bid-mode-repository/bid-mode-repository";

@Injectable()
export class BidService {

    constructor(
        private readonly productRepositoryService: ProductRepositoryService,
        private readonly bidRepositoryService: BidRepositoryService,
        private readonly userRepositoryService: UserRepositoryService,
        private readonly bidModeRepositoryService: BidModeRepositoryService
    ) { }


    // Place Bid API
    async placeBid(params: {
        productId: string,
        bidderId: string,
        bidAmount?: number,
        bidTime: Date
    }) {
        try {

            const { productId, bidderId, bidAmount, bidTime } = params;

            // Convert string IDs to ObjectId
            const productObjectId = new Types.ObjectId(productId);
            const bidderObjectId = new Types.ObjectId(bidderId);

            // Validate product exists
            const product = await this.productRepositoryService.findProductById(productId);
            if (!product) {
                throw new BadRequestException('Product not found');
            }

            // Check if product is approved and active
            if (product.productStatus !== ProductStatus.APPROVED) {
                throw new BadRequestException('Product is not available for bidding');
            }

            // Check if auction is active (combining date and time checks)
            const now = new Date();
            const auctionStart = new Date(product.bidStartTime);
            const auctionEnd = new Date(product.bidEndTime);

            // Validate auction timing
            if (isNaN(auctionStart.getTime()) || isNaN(auctionEnd.getTime())) {
                throw new BadRequestException('Invalid auction timing configuration');
            }

            console.log('Current time:', now.toISOString());
            console.log('Auction start:', auctionStart.toISOString());
            console.log('Auction end:', auctionEnd.toISOString());

            // Check if auction has not started yet
            if (now < auctionStart) {
                const timeUntilStart = Math.ceil((auctionStart.getTime() - now.getTime()) / (1000 * 60)); // minutes
                const hoursUntilStart = Math.floor(timeUntilStart / 60);
                const minutesRemaining = timeUntilStart % 60;

                let timeMessage = '';
                if (hoursUntilStart > 0) {
                    timeMessage = `${hoursUntilStart} hour${hoursUntilStart > 1 ? 's' : ''} and ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
                } else {
                    timeMessage = `${timeUntilStart} minute${timeUntilStart !== 1 ? 's' : ''}`;
                }

                throw new BadRequestException(
                    `Auction has not started yet. It will start in ${timeMessage} at ${auctionStart.toLocaleString()}`
                );
            }

            // Check if auction has ended
            if (now >= auctionEnd) {
                const timeAfterEnd = Math.ceil((now.getTime() - auctionEnd.getTime()) / (1000 * 60)); // minutes
                const hoursAfterEnd = Math.floor(timeAfterEnd / 60);
                const minutesAfterEnd = timeAfterEnd % 60;

                let timeMessage = '';
                if (hoursAfterEnd > 0) {
                    timeMessage = `${hoursAfterEnd} hour${hoursAfterEnd > 1 ? 's' : ''} and ${minutesAfterEnd} minute${minutesAfterEnd !== 1 ? 's' : ''}`;
                } else {
                    timeMessage = `${timeAfterEnd} minute${timeAfterEnd !== 1 ? 's' : ''}`;
                }

                throw new BadRequestException(
                    `Auction has ended ${timeMessage} ago at ${auctionEnd.toLocaleString()}`
                );
            }

            // Additional validation: Check if bid time is within auction window
            if (bidTime < auctionStart || bidTime >= auctionEnd) {
                throw new BadRequestException('Bid time is outside the auction window');
            }

            // Get user's bid mode for this product
            const userBidMode = await this.bidModeRepositoryService.findBidMode({
                userId: bidderObjectId,
                productId: productObjectId
            });

            // Determine the actual bid amount based on user's bid mode
            let actualBidAmount: number;
            let bidType: string = 'MANUAL'; // Default

            // If no bid mode is set, default to MANUAL
            const effectiveBidMode = userBidMode?.bidMode || BidModeStatus.MANUAL;

            if (effectiveBidMode === BidModeStatus.MANUAL) {
                // Manual bidding mode
                if (!bidAmount) {
                    throw new BadRequestException('Bid amount is required for manual bidding');
                }
                actualBidAmount = bidAmount;
                bidType = 'MANUAL';
            } else if (effectiveBidMode === BidModeStatus.AUTO) {
                // Automatic bidding mode
                if (bidAmount) {
                    throw new BadRequestException('Bid amount should not be provided for automatic bidding mode');
                }

                if (!userBidMode || !userBidMode.autoIncrementAmount) {
                    throw new BadRequestException('Auto increment amount not configured for automatic bidding');
                }

                // Calculate automatic bid amount
                const currentHighestBid = product.currentHighestBid || product.startingPrice || 0;
                actualBidAmount = currentHighestBid + Number(userBidMode.autoIncrementAmount);
                bidType = 'AUTO';
            } else {
                throw new BadRequestException('Invalid bid mode');
            }

            // Check if user already has the highest bid
            if (product.currentHighestBidderId &&
                product.currentHighestBidderId.toString() === bidderId) {
                throw new BadRequestException('You already have the highest bid');
            }

            // Validate bid amount against minimum requirements
            const minimumBid = product.currentHighestBid
                ? product.currentHighestBid + 1
                : product.startingPrice || 1;

            if (actualBidAmount < minimumBid) {
                throw new BadRequestException(`Bid amount must be at least ${minimumBid}`);
            }

            // Validate starting price requirement
            if (product.startingPrice && actualBidAmount < product.startingPrice) {
                throw new BadRequestException(`Bid amount must be at least the starting price of ${product.startingPrice}`);
            }

            // Create new bid
            const newBidData = {
                productId: productObjectId,
                bidderId: bidderObjectId,
                bidAmount: actualBidAmount,
                bidTime,
                isWinningBid: true, // This will be the new winning bid
                bidStatus: BidStatus.ACTIVE,
                bidType: bidType,
            };

            const createdBid = await this.bidRepositoryService.createBid(newBidData);

            if (!createdBid) {
                throw new BadRequestException('Failed to create bid');
            }

            // Update previous winning bid (if any)
            if (product.currentHighestBidderId) {
                await this.bidRepositoryService.updatePreviousWinningBids(
                    productId,
                    product.currentHighestBidderId.toString()
                );
            }

            // Update product with new highest bid
            await this.productRepositoryService.updateProduct(productId, {
                currentHighestBid: actualBidAmount,
                currentHighestBidderId: bidderObjectId,
            });

            const response: PlaceBidResponse = {
                message: `Bid placed successfully using ${bidType.toLowerCase()} bidding`,
                bid: {
                    bidId: (createdBid._id as Types.ObjectId).toString(),
                    productId: createdBid.productId.toString(),
                    bidderId: createdBid.bidderId.toString(),
                    bidAmount: createdBid.bidAmount,
                    bidTime: createdBid.bidTime,
                    isWinningBid: createdBid.isWinningBid,
                    bidStatus: createdBid.bidStatus,
                }
            }

            return response;

        } catch (error) {
            console.error('Error placing bid:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to place bid: ${error.message}`);
        }
    }


    // Get All Bids by Product ID
    async getAllBidsByProductId(productId: string, userId: string, userRole: string) {
        try {

            const product = await this.productRepositoryService.findProductById(productId);

            if (!product) {
                throw new BadRequestException('Product not found');
            }

            // Check if farmer is the owner of the product
            if (userRole === 'FARMER' && product.farmerId.toString() !== userId) {
                throw new ForbiddenException('You can only view bids for your own products');
            }

            const bids = await this.bidRepositoryService.findBidsByProductId({
                productId: new Types.ObjectId(productId)
            });

            const sortedBids = bids.sort((a, b) => new Date(a.bidTime).getTime() - new Date(b.bidTime).getTime());

            const formattedBids = await Promise.all(
                sortedBids.map(async (bid: any, index: number) => {
                    let bidderName: string | undefined = undefined;
                    if (this.userRepositoryService) {
                        try {
                            const bidder = await this.userRepositoryService.findById(bid.bidderId.toString());
                            bidderName = bidder?.name || undefined;
                        } catch (error) {
                            // Ignore errors
                        }
                    }

                    // For first bid, previousBidAmount is null
                    // For subsequent bids, get the actual previous bid amount
                    let previousBidAmount: number | null = null;
                    if (index > 0) {
                        previousBidAmount = sortedBids[index - 1].bidAmount;
                    }

                    // Handle incrementAmount based on bidType
                    let incrementAmount: number | null = null;
                    if (bid.bidType === 'AUTO' && bid.incrementAmount !== undefined) {
                        // Get incrementAmount from DB for AUTO bids
                        incrementAmount = bid.incrementAmount;
                    } else if (bid.bidType === 'MANUAL') {
                        // Set to null for MANUAL bids
                        incrementAmount = null;
                    }

                    return {
                        bidId: bid._id.toString(),
                        productId: bid.productId.toString(),
                        bidderId: bid.bidderId.toString(),
                        bidderName,
                        bidderInitials: bidderName ? bidderName.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN',
                        currentBidAmount: bid.bidAmount,
                        previousBidAmount,
                        incrementAmount,
                        bidTime: bid.bidTime,
                        timeAgo: this.getTimeAgo(bid.bidTime), // Helper method for "2 min ago"
                        isWinningBid: bid.isWinningBid,
                        bidStatus: bid.bidStatus,
                        bidType: bid.bidType || 'MANUAL',
                    };
                })
            );

            const reversedBids = formattedBids.reverse();

            return {
                message: formattedBids.length > 0 ? 'Bids retrieved successfully' : 'No bids found for this product',
                totalBids: formattedBids.length,
                highestBid: formattedBids.length > 0 ? reversedBids[0].currentBidAmount : 0,
                startingPrice: product.startingPrice || 0,
                bids: reversedBids
            };

        } catch (error) {
            console.error('Error getting bids:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to get bids: ${error.message}`);
        }
    }


    // Helper method to calculate time ago
    private getTimeAgo(bidTime: Date): string {
        const now = new Date();
        const diffInMs = now.getTime() - new Date(bidTime).getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes === 1) return '1 min ago';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours === 1) return '1 hour ago';
        if (diffInHours < 24) return `${diffInHours} hours ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return '1 day ago';
        return `${diffInDays} days ago`;
    }

}
