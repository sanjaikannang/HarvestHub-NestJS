import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateProductRequest } from "src/api/user/create-product/create-product.request";
import { CreateProductResponse } from "src/api/user/create-product/create-product.response";
import { ConfigService } from "src/config/config.service";
import { Types } from "mongoose";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";

@Injectable()
export class ProductService {

    constructor(
        private readonly configService: ConfigService,
        private readonly productRepository: ProductRepositoryService,
    ) { }


    // Create Product API Endpoint
    async createProduct(createProductRequest: CreateProductRequest, userId: string): Promise<CreateProductResponse> {

        try {

            // Validate dates
            const bidStartDate = new Date(createProductRequest.bidStartDate);
            const bidEndDate = new Date(createProductRequest.bidEndDate);

            // Parse times and combine with dates
            const [startHours, startMinutes] = createProductRequest.bidStartTime.split(':').map(Number);
            const [endHours, endMinutes] = createProductRequest.bidEndTime.split(':').map(Number);

            const bidStartDateTime = new Date(bidStartDate);
            bidStartDateTime.setHours(startHours, startMinutes);

            const bidEndDateTime = new Date(bidEndDate);
            bidEndDateTime.setHours(endHours, endMinutes);

            const now = new Date();

            // Validate bid start time is in the future
            if (bidStartDateTime < now) {
                throw new BadRequestException('Bid start time must be in the future');
            }

            // Validate bid end time is after bid start time
            if (bidEndDateTime <= bidStartDateTime) {
                throw new BadRequestException('Bid end time must be after bid start time');
            }

            // Calculate time difference between start and end dates in milliseconds
            const dateDifference = bidEndDate.getTime() - bidStartDate.getTime();
            const dayDifference = dateDifference / (1000 * 60 * 60 * 24);

            // Validate bid dates are at least 1 day apart
            if (dayDifference < 1) {
                throw new BadRequestException('Bid start date and end date must be at least 1 day apart');
            }

            // Calculate the time difference between bid start and end times in minutes
            const timeDifferenceMs = bidEndDateTime.getTime() - bidStartDateTime.getTime();
            const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

            // Validate min bid window (30 minutes)
            if (timeDifferenceMinutes < 30) {
                throw new BadRequestException('Minimum bidding time window must be at least 30 minutes');
            }

            // Validate max bid window (2 hours = 120 minutes)
            if (timeDifferenceMinutes > 120) {
                throw new BadRequestException('Maximum bidding time window cannot exceed 2 hours');
            }

            // Check if there are at least 3 images
            if (!createProductRequest.images || createProductRequest.images.length < 3) {
                throw new BadRequestException('At least 3 images are required');
            }

            // Create the product
            const createdProduct = await this.productRepository.createProduct({
                name: createProductRequest.name,
                description: createProductRequest.description,
                farmerId: new Types.ObjectId(userId),
                quantity: createProductRequest.quantity,
                images: createProductRequest.images,
                startingPrice: createProductRequest.startingPrice,
                bidStartDate: bidStartDate,
                bidEndDate: bidEndDate,
                bidStartTime: bidStartDateTime,
                bidEndTime: bidEndDateTime,
            });

            // Transform to response object
            const response: CreateProductResponse = {
                message: "Product created successfully",
                product: {
                    id: createdProduct.id,
                    name: createdProduct.name,
                    description: createdProduct.description,
                    farmerId: createdProduct.farmerId,
                    quantity: createdProduct.quantity,
                    images: createdProduct.images,
                    startingPrice: createdProduct.startingPrice,
                    bidStartDate: createdProduct.bidStartDate,
                    bidEndDate: createdProduct.bidEndDate,
                    bidStartTime: createdProduct.bidStartTime,
                    bidEndTime: createdProduct.bidEndTime,
                    productStatus: createdProduct.productStatus,
                    shippingStatus: createdProduct.shippingStatus,
                }
            };

            return response;

        } catch (error) {
            throw new BadRequestException(`Failed to create product: ${error.message}`);
        }
    }

}