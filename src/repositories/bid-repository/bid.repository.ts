import { Injectable } from "@nestjs/common";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Bid, BidDocument } from "src/schemas/bid.schema";
import { BidStatus } from "src/utils/enum";

@Injectable()
export class BidRepositoryService {

    constructor(
        @InjectModel(Bid.name) private readonly bidModel: Model<BidDocument>
    ) { }


    // Method to create a bid
    async createBid(bidData: {
        productId: Types.ObjectId;
        bidderId: Types.ObjectId;
        bidAmount: number;
        bidTime: Date;
        isWinningBid?: boolean;
        bidStatus?: BidStatus;
    }): Promise<BidDocument> {

        try {

            const newBid = new this.bidModel({
                productId: bidData.productId,
                bidderId: bidData.bidderId,
                bidAmount: bidData.bidAmount,
                bidTime: bidData.bidTime,
                isWinningBid: bidData.isWinningBid || false,
                bidStatus: bidData.bidStatus || BidStatus.ACTIVE
            });

            return await newBid.save();

        } catch (error) {
            console.error('Error creating bid:', error);
            throw new Error('Failed to create bid');
        }
    }


    // Update the previous winning bids
    async updatePreviousWinningBids(productId: string, previousBidderId: string): Promise<void> {
        try {
            await this.bidModel.updateMany(
                {
                    productId: new Types.ObjectId(productId),
                    bidderId: new Types.ObjectId(previousBidderId),
                    isWinningBid: true
                },
                {
                    $set: { isWinningBid: false }
                }
            );
        } catch (error) {
            console.error('Error updating previous winning bids:', error);
            throw new Error('Failed to update previous winning bids');
        }
    }


    // Get recent bids by product ID
    async getRecentBidsByProductId(productId: string, limit: number = 10): Promise<BidDocument[]> {
        try {
            return await this.bidModel
                .find({ productId: new Types.ObjectId(productId) })
                .sort({ bidTime: -1 }) // Sort by bidTime in descending order (most recent first)
                .limit(limit)
                .populate('bidderId', 'name email') // Optional: populate bidder details
                .exec();
        } catch (error) {
            console.error('Error getting recent bids:', error);
            throw new Error('Failed to get recent bids');
        }
    }


    // Count bids by product ID
    async countBidsByProductId(productId: string): Promise<number> {
        try {
            return await this.bidModel.countDocuments({
                productId: new Types.ObjectId(productId)
            });
        } catch (error) {
            console.error('Error counting bids:', error);
            throw new Error('Failed to count bids');
        }
    }


    // Close non-winning bids
    async closeNonWinningBids(productId: string): Promise<void> {
        try {
            await this.bidModel.updateMany(
                {
                    productId: new Types.ObjectId(productId),
                    isWinningBid: false,
                    bidStatus: BidStatus.ACTIVE
                },
                {
                    $set: { bidStatus: BidStatus.CLOSED }
                }
            );
        } catch (error) {
            console.error('Error closing non-winning bids:', error);
            throw new Error('Failed to close non-winning bids');
        }
    }


    // Get winning bid for a product
    async getWinningBid(productId: string): Promise<BidDocument | null> {
        try {
            return await this.bidModel
                .findOne({
                    productId: new Types.ObjectId(productId),
                    isWinningBid: true
                })
                .populate('bidderId', 'name email')
                .exec();
        } catch (error) {
            console.error('Error getting winning bid:', error);
            throw new Error('Failed to get winning bid');
        }
    }


    // Get all bids by user
    async getBidsByUser(userId: string): Promise<BidDocument[]> {
        try {
            return await this.bidModel
                .find({ bidderId: new Types.ObjectId(userId) })
                .sort({ bidTime: -1 })
                .populate('productId', 'name description startingPrice')
                .exec();
        } catch (error) {
            console.error('Error getting user bids:', error);
            throw new Error('Failed to get user bids');
        }
    }


}