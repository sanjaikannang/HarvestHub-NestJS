import { BadRequestException, Injectable } from "@nestjs/common";
import { GetAllUserRequest } from "src/api/user/get-all-user/get-all-user.request";
import { GetAllUserResponse, PaginationInfo, UserResponse } from "src/api/user/get-all-user/get-all-user.response";
import { UserRepositoryService } from "src/repositories/user-repository/user.repository";
import { Types } from "mongoose";
import { GetSpecificUserRequest } from "src/api/user/get-specific-user/get-specific-user.request";
import { GetSpecificUserResponse } from "src/api/user/get-specific-user/get-specific-user.response";
import { DeleteUserRequest } from "src/api/user/delete-user/delete-user.request";
import { DeleteUserResponse } from "src/api/user/delete-user/delete-user.response";

@Injectable()
export class UserService {

    constructor(
        private readonly userRepository: UserRepositoryService,
    ) { }


    // Get All User API Endpoint
    async getAllUser(getAllUserRequest: GetAllUserRequest): Promise<GetAllUserResponse> {
        try {
            const { page = 1, limit = 10, userRole } = getAllUserRequest;

            // Calculate skip value for pagination
            const skip = (page - 1) * limit;

            // Create filter object based on provided userRole
            const filter: any = {};
            if (userRole) {
                filter.role = userRole;
            }

            // Get users with pagination
            const users = await this.userRepository.findUsers(filter, skip, limit);

            // Get total count of users matching the filter
            const totalUsers = await this.userRepository.countUsers(filter);

            // Calculate pagination information
            const totalPages = Math.ceil(totalUsers / limit);

            // Map users to UserResponse format
            const userResponses: UserResponse[] = users.map(user => ({
                _id: (user._id as Types.ObjectId).toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }));

            // Create pagination info
            const paginationInfo: PaginationInfo = {
                currentPage: page,
                totalPages,
                totalUsers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            };

            return {
                message: 'Users retrieved successfully',
                pagination: paginationInfo,
                user: userResponses
            };
        } catch (error) {
            throw new Error(`Failed to get users: ${error.message}`);
        }
    }


    // Get Specific User API Endpoint
    async getSpecificUser(getSpecificUserRequest: GetSpecificUserRequest): Promise<GetSpecificUserResponse> {

        try {
            const { userId } = getSpecificUserRequest;

            // Find user by ID
            const user = await this.userRepository.findById(userId);

            // If user not found, throw an exception
            if (!user) {
                throw new BadRequestException(`User with ID ${userId} not found`);
            }

            // Map user to UserResponse format
            const userResponse: UserResponse = {
                _id: (user._id as Types.ObjectId).toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            return {
                message: 'User retrieved successfully',
                user: [userResponse]
            };
        } catch (error) {
            throw new Error(`Failed to get users: ${error.message}`);
        }
    }


    // Delete User API Endpoint
    async deleteUser(deleteUserRequest: DeleteUserRequest): Promise<DeleteUserResponse> {

        try {

            // Validate the user ID
            if (!deleteUserRequest.userId || !Types.ObjectId.isValid(deleteUserRequest.userId)) {
                throw new BadRequestException('Invalid user ID');
            }

            // Call repository to delete the user
            const deletedUser = await this.userRepository.deleteUserById(deleteUserRequest.userId);

            // If no user was found with the provided ID
            if (!deletedUser) {
                throw new BadRequestException(`User with ID ${deleteUserRequest.userId} not found`);
            }

            // Return success response
            return {
                message: `User with ID ${deleteUserRequest.userId} has been successfully deleted`
            };

        } catch (error) {

            // Re-throw NestJS exceptions to maintain their type and status code
            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new Error(`Failed to Delete user: ${error.message}`);
        }

    }


}