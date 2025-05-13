import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateProductRequest } from "src/api/user/create-product/create-product.request";
import { CreateProductResponse } from "src/api/user/create-product/create-product.response";
import { ConfigService } from "src/config/config.service";
import { Schema as MongooseSchema } from "mongoose";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";

@Injectable()
export class ProductService {

    constructor(
        private readonly configService: ConfigService,
        private readonly productRepository: ProductRepositoryService,
    ) { }


    // Create Product API Endpoint
    async createProduct(createProductRequest: CreateProductRequest, currentUserId: string): Promise<CreateProductResponse> {

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

            if (bidStartDateTime < now) {
                throw new BadRequestException('Bid start time must be in the future');
            }

            if (bidEndDateTime <= bidStartDateTime) {
                throw new BadRequestException('Bid end time must be after bid start time');
            }

            // Check if there are at least 3 images
            if (!createProductRequest.images || createProductRequest.images.length < 3) {
                throw new BadRequestException('At least 3 images are required');
            }

            // Create the product
            const createdProduct = await this.productRepository.createProduct({
                name: createProductRequest.name,
                description: createProductRequest.description,
                farmerId: new MongooseSchema.Types.ObjectId(currentUserId),
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
                    status: createdProduct.status,
                    shippingStatus: createdProduct.shippingStatus,
                }
            };

            return response;

        } catch (error) {
            throw new BadRequestException(`Failed to create product: ${error.message}`);
        }
    }

}