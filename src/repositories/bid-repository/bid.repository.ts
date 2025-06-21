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
        currentBidAmount: number;
        previousBidAmount: number | null;
        incrementAmount: number | null;
        bidTime: Date;
        isWinningBid?: boolean;
        bidStatus?: BidStatus;
        bidType?: string;
    }): Promise<BidDocument> {

        try {

            const newBid = new this.bidModel({
                productId: bidData.productId,
                bidderId: bidData.bidderId,
                bidAmount: bidData.bidAmount,
                currentBidAmount: bidData.currentBidAmount,
                previousBidAmount: bidData.previousBidAmount,
                incrementAmount: bidData.incrementAmount,
                bidTime: bidData.bidTime,
                isWinningBid: bidData.isWinningBid || false,
                bidStatus: bidData.bidStatus || BidStatus.ACTIVE,
                bidType: bidData.bidType || 'MANUAL'
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


    // Find bids by product ID with pagination
    async findBidsByProductIdWithPagination(
        filter: any,
        page: number,
        limit: number,
        sort: any
    ): Promise<{ bids: any[], totalCount: number }> {
        try {
            const skip = (page - 1) * limit;

            // Execute both queries in parallel
            const [bids, totalCount] = await Promise.all([
                this.bidModel
                    .find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.bidModel.countDocuments(filter).exec()
            ]);

            return { bids, totalCount };
        } catch (error) {
            console.error('Error finding bids with pagination:', error);
            throw error;
        }
    }


    // Find all bids by product ID
    async findBidsByProductId(filter: any) {

        const bids = await this.bidModel.find(filter).exec();

        return bids;
    }


    // Get bid statistics for a product
    async getBidStatisticsForProduct(productId: string): Promise<{
        totalBids: number;
        highestBid: number;
        averageBid: number;
        uniqueBidders: number;
    }> {
        try {
            const productObjectId = new Types.ObjectId(productId);

            const stats = await this.bidModel.aggregate([
                {
                    $match: {
                        productId: productObjectId,
                        bidStatus: BidStatus.ACTIVE
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalBids: { $sum: 1 },
                        highestBid: { $max: "$currentBidAmount" },
                        averageBid: { $avg: "$currentBidAmount" },
                        uniqueBidders: { $addToSet: "$bidderId" }
                    }
                },
                {
                    $project: {
                        totalBids: 1,
                        highestBid: 1,
                        averageBid: { $round: ["$averageBid", 2] },
                        uniqueBidders: { $size: "$uniqueBidders" }
                    }
                }
            ]);

            return stats[0] || {
                totalBids: 0,
                highestBid: 0,
                averageBid: 0,
                uniqueBidders: 0
            };

        } catch (error) {
            console.error('Error getting bid statistics:', error);
            throw new Error('Failed to get bid statistics');
        }
    }

    // Get bid history with all new fields (useful for detailed analysis)
    async getBidHistoryWithDetails(productId: string): Promise<any[]> {
        try {
            const bids = await this.bidModel
                .find({
                    productId: new Types.ObjectId(productId),
                    bidStatus: BidStatus.ACTIVE
                })
                .sort({ bidTime: 1 }) // Sort by time ascending
                .select('bidderId currentBidAmount previousBidAmount incrementAmount bidTime bidType isWinningBid')
                .exec();

            return bids;
        } catch (error) {
            console.error('Error getting bid history with details:', error);
            throw new Error('Failed to get bid history with details');
        }
    }


}