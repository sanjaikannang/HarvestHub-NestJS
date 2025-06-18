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


}