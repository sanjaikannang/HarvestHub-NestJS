import { Injectable } from "@nestjs/common";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Bid, BidDocument } from "src/schemas/bid.schema";
import { BidModeDocument } from "src/schemas/bid-mode.schema";

@Injectable()
export class BidModeRepositoryService {

    constructor(
        @InjectModel(Bid.name) private readonly bidModeModel: Model<BidModeDocument>
    ) { }


    // Create Bid Mode
    async createBidMode(newBidModeData) {

    }


    // Find Bid Mode
    async findBidMode(userId, productId) {

        return true

    }


    // Update Bid Mode
    async updateBidMode (existingBidMode, {}){

    }


}