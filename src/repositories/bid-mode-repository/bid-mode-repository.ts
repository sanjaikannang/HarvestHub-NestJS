import { Injectable } from "@nestjs/common";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { BidMode, BidModeDocument } from "src/schemas/bid-mode.schema";

@Injectable()
export class BidModeRepositoryService {

    constructor(
        @InjectModel(BidMode.name) private readonly bidModeModel: Model<BidModeDocument>
    ) { }


    // Create Bid Mode
    async createBidMode(newBidModeData: Partial<BidMode>): Promise<BidModeDocument> {
        try {
            const createdBidMode = new this.bidModeModel(newBidModeData);
            const savedBidMode = await createdBidMode.save();
            return savedBidMode;
        } catch (error) {
            console.error('Error creating bid mode:', error);
            throw error;
        }
    }


    // Find Bid Mode
    async findBidMode(filter: {
        userId: Types.ObjectId;
        productId: Types.ObjectId;
    }): Promise<BidModeDocument | null> {
        try {
            const result = await this.bidModeModel.findOne({
                userId: filter.userId,
                productId: filter.productId,
            }).exec();

            return result;
        } catch (error) {
            console.error('Error finding bid mode:', error);
            throw error;
        }
    }


    // Update Bid Mode
    async updateBidMode(
        bidModeId: Types.ObjectId | string,
        updateData: Partial<BidMode>
    ): Promise<BidModeDocument | null> {
        try {
            const result = await this.bidModeModel.findByIdAndUpdate(
                bidModeId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).exec();

            return result;
        } catch (error) {
            console.error('Error updating bid mode:', error);
            throw error;
        }
    }


    // Update Bid Mode with explicit field removal (for MANUAL mode)
    async updateBidModeWithUnset(
        bidModeId: Types.ObjectId | string,
        updateData: Partial<BidMode>,
        fieldsToUnset: string[] = []
    ): Promise<BidModeDocument | null> {
        try {
            const updateQuery: any = {
                $set: updateData
            };

            // Add $unset operation for specified fields
            if (fieldsToUnset.length > 0) {
                updateQuery.$unset = {};
                fieldsToUnset.forEach(field => {
                    updateQuery.$unset[field] = "";
                });
            }

            const result = await this.bidModeModel.findByIdAndUpdate(
                bidModeId,
                updateQuery,
                { new: true, runValidators: true }
            ).exec();

            return result;
        } catch (error) {
            console.error('Error updating bid mode with unset:', error);
            throw error;
        }
    }


    // Find Bid Mode by ID
    async findBidModeById(bidModeId: string): Promise<BidModeDocument | null> {
        try {
            if (!Types.ObjectId.isValid(bidModeId)) {
                return null;
            }
            return await this.bidModeModel.findById(bidModeId).exec();
        } catch (error) {
            console.error('Error finding bid mode by ID:', error);
            throw error;
        }
    }


}