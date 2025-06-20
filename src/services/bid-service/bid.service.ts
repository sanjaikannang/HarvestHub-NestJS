import { BadRequestException, Injectable } from "@nestjs/common";
import { BidRepositoryService } from "src/repositories/bid-repository/bid.repository";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";
import { BidStatus, ProductStatus } from "src/utils/enum";
import { Types } from 'mongoose';
import { PlaceBidResponse } from "src/api/bid/place-bid/place-bid.response";
import { GetAllBidsResponse } from "src/api/bid/get-all-bids/get-all-bids.response";
import { UserRepositoryService } from "src/repositories/user-repository/user.repository";
import { GetAllBidsRequest } from "src/api/bid/get-all-bids/get-all-bids.request";

@Injectable()
export class BidService {

    constructor(
        private readonly productRepositoryService: ProductRepositoryService,
        private readonly bidRepositoryService: BidRepositoryService,
        private readonly userRepositoryService: UserRepositoryService
    ) { }


    // Place Bid API
    async placeBid(params: {
        productId: string,
        bidderId: string,
        bidAmount: number,
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
            const auctionStart = this.combineDateTime(product.bidStartDate, product.bidStartTime);
            const auctionEnd = this.combineDateTime(product.bidEndDate, product.bidEndTime);

            if (now < auctionStart) {
                throw new BadRequestException('Auction has not started yet');
            }

            if (now > auctionEnd) {
                throw new BadRequestException('Auction has ended');
            }

            // Check if farmer is trying to bid on own product
            if (product.farmerId.toString() === bidderId) {
                throw new BadRequestException('You cannot bid on your own product');
            }

            // Check if bid amount is higher than current highest bid
            const minimumBid = product.currentHighestBid ? product.currentHighestBid + 1 : product.startingPrice;
            if (bidAmount < minimumBid) {
                throw new BadRequestException('Bid amount must be at least $' + minimumBid);
            }

            // Check if user already has the highest bid
            if (product.currentHighestBidderId &&
                product.currentHighestBidderId.toString() === bidderId) {
                throw new BadRequestException('You already have the highest bid');
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

            const response: PlaceBidResponse = {
                message: "Bid Placed successfully",
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
            throw new BadRequestException(`Failed to place bid. ${error.message}`);
        }
    }


    // Helper method to combine date and time
    private combineDateTime(date: Date, time: Date): Date {
        if (!date || !time) return date || time;

        const combined = new Date(date);
        const timeDate = new Date(time);

        combined.setHours(timeDate.getHours());
        combined.setMinutes(timeDate.getMinutes());
        combined.setSeconds(timeDate.getSeconds());
        combined.setMilliseconds(timeDate.getMilliseconds());

        return combined;
    }


    // Get All Bids by Product ID
    async getAllBidsByProductId(productId: string) {
        try {

            const product = await this.productRepositoryService.findProductById(productId);

            if (!product) {
                throw new BadRequestException('Product not found');
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

                    // Get all previous bids by this bidder
                    const bidderPreviousBids = sortedBids
                        .slice(0, index)
                        .filter(prevBid => prevBid.bidderId.toString() === bid.bidderId.toString());

                    // Calculate based on immediate previous bid in auction
                    const previousBidAmount = index === 0
                        ? (product.startingPrice || 0)
                        : sortedBids[index - 1].bidAmount;

                    const incrementAmount = bid.bidAmount - previousBidAmount;

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
            throw new BadRequestException(`Failed to get bids. ${error.message}`);
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
