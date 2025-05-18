import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/schemas/user.schema";

@Injectable()
export class UserRepositoryService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }


    // Find User By Email
    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }


    // Find User By ID
    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }


    // Craete User
    async create(userData: Partial<User>): Promise<UserDocument> {
        const newUser = new this.userModel(userData);
        return newUser.save();
    }


    // Check if Email Exists
    async emailExists(email: string): Promise<boolean> {
        const count = await this.userModel.countDocuments({ email }).exec();
        return count > 0;
    }


    // Find users with pagination and filtering
    async findUsers(filter: any, skip: number, limit: number): Promise<UserDocument[]> {
        return this.userModel
            .find(filter)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)
            .exec();
    }


    // Count total users matching the filter criteria
    async countUsers(filter: any): Promise<number> {
        return this.userModel.countDocuments(filter).exec();
    }


    // Delete User
    async deleteUserById(userId: string): Promise<UserDocument | null> {
        return this.userModel.findByIdAndDelete(userId).exec();
    }

}