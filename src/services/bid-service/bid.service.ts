import { BadRequestException, Injectable } from "@nestjs/common";
import { BidRepositoryService } from "src/repositories/bid-repository/bid.repository";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";
import { BidStatus, ProductStatus } from "src/utils/enum";
import { Types } from 'mongoose';
import { PlaceBidResponse } from "src/api/bid/place-bid/place-bid.response";

@Injectable()
export class BidService {

    constructor(
        private readonly productRepositoryService: ProductRepositoryService,
        private readonly bidRepositoryService: BidRepositoryService
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
                message: "Product created successfully",
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

        } catch (error) {

        }
    }

}