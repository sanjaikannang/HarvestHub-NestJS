import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateProductRequest } from "src/api/user/create-product/create-product.request";
import { CreateProductResponse } from "src/api/user/create-product/create-product.response";
import { ConfigService } from "src/config/config.service";
import { Types } from "mongoose";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";
import { GetAllProductRequest } from "src/api/user/get-all-product/get-all-product.request";
import { GetAllProductResponse, PaginationInfo } from "src/api/user/get-all-product/get-all-product.response";
import { ProductStatus } from "src/utils/enum";
import { GetSpecificProductResponse } from "src/api/user/get-specific-product/get-specific-product.response";
import { GetSpecificProductRequest } from "src/api/user/get-specific-product/get-specific-product.request";

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

            // Parse full ISO datetime strings
            const bidStartDateTime = new Date(createProductRequest.bidStartTime);
            const bidEndDateTime = new Date(createProductRequest.bidEndTime);

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

            if (dayDifference > 3) {
                throw new BadRequestException('Bid start date and end date cannot be more than 3 days apart');
            }

            // Verify bidStartTime date falls within the overall bidding window
            const bidStartTimeDate = bidStartDateTime.toISOString().split('T')[0];
            if (bidStartTimeDate < bidStartDate.toISOString().split('T')[0] ||
                bidStartTimeDate > bidEndDate.toISOString().split('T')[0]) {
                throw new BadRequestException('Bid start time must fall within the overall bidding window');
            }

            // Verify bidEndTime date falls within the overall bidding window
            const bidEndTimeDate = bidEndDateTime.toISOString().split('T')[0];
            if (bidEndTimeDate < bidStartDate.toISOString().split('T')[0] ||
                bidEndTimeDate > bidEndDate.toISOString().split('T')[0]) {
                throw new BadRequestException('Bid end time must fall within the overall bidding window');
            }

            // Calculate the time difference between bid start and end times in minutes
            const timeDifferenceMinutes = (bidEndDateTime.getTime() - bidStartDateTime.getTime()) / (1000 * 60);

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


    // Get All Product API Endpoint
    async getAllProduct(getAllProductRequest: GetAllProductRequest, userId: string, userRole: string): Promise<GetAllProductResponse> {

        try {
            // Validate request parameters
            this.validateGetAllProductRequest(getAllProductRequest);

            // Set default pagination values
            const page = getAllProductRequest.page ? parseInt(getAllProductRequest.page.toString()) : 1;
            const limit = getAllProductRequest.limit ? parseInt(getAllProductRequest.limit.toString()) : 10;
            const skip = (page - 1) * limit;

            // Build the query based on filters
            const query: any = {};

            // Filter by product status if provided
            if (getAllProductRequest.productStatus) {
                query.productStatus = getAllProductRequest.productStatus;
            }

            // If role is farmer, only show their own products
            if (userRole === 'Farmer') {
                query.farmerId = new Types.ObjectId(userId);
            }

            // If role is buyer, only show products with APPROVED and ACTIVE status
            if (userRole === 'Buyer') {
                query.productStatus = { $in: [ProductStatus.APPROVED, ProductStatus.ACTIVE] };
            }

            const result = await this.productRepository.findProducts(
                query,
                skip,
                limit
            );

            // logic for pagination calculation
            const totalProducts = result.totalProducts;
            const totalPages = Math.ceil(totalProducts / limit);

            // logic for formatting the products data
            const formattedProducts = result.products.map(product => {
                return {
                    _id: (product._id as Types.ObjectId).toString(),
                    name: product.name,
                    description: product.description,
                    farmerId: product.farmerId._id.toString(),
                    quantity: product.quantity,
                    startingPrice: product.startingPrice,
                    currentHighestBid: product.currentHighestBid,
                    bidStartDate: product.bidStartDate,
                    bidEndDate: product.bidEndDate,
                    bidStartTime: product.bidStartTime,
                    bidEndTime: product.bidEndTime,
                    images: product.images,
                    productStatus: product.productStatus,
                };
            });

            // Prepare pagination info
            const paginationInfo: PaginationInfo = {
                currentPage: page,
                totalPages,
                totalProducts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            };

            // Construct and return the response
            return {
                message: 'Products retrieved successfully',
                count: formattedProducts.length,
                pagination: paginationInfo,
                product: formattedProducts,
            };

        } catch (error) {
            throw new Error(`Failed to get products: ${error.message}`);
        }

    }


    private validateGetAllProductRequest(request: GetAllProductRequest): void {
        // Validate page and limit if provided
        if (request.page && (isNaN(Number(request.page)) || Number(request.page) < 1)) {
            throw new BadRequestException('Page must be a positive number');
        }

        if (request.limit && (isNaN(Number(request.limit)) || Number(request.limit) < 1)) {
            throw new BadRequestException('Limit must be a positive number');
        }
    }


    // Get Specific Product API Endpoint
    async getSpecificProduct(getSpecificProductRequest: GetSpecificProductRequest): Promise<GetSpecificProductResponse> {

        const { productId } = getSpecificProductRequest;

        // Validate ObjectId directly in the controller
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException(`Invalid product ID format: ${productId}`);
        }

        try {

            // Query the database to find the product by ID
            const product = await this.productRepository.findProductById(productId);

            if (!product) {
                return {
                    message: 'Product not found',
                    product: []
                };
            }

            // Transform MongoDB document to ProductResponse format
            const productResponse = {
                _id: (product._id as Types.ObjectId).toString(),
                name: product.name,
                description: product.description,
                farmerId: product.farmerId.toString(),
                quantity: product.quantity,
                images: product.images,
                startingPrice: product.startingPrice,
                currentHighestBid: product.currentHighestBid,
                bidStartDate: product.bidStartDate,
                bidEndDate: product.bidEndDate,
                bidStartTime: product.bidStartTime,
                bidEndTime: product.bidEndTime,
                productStatus: product.productStatus
            };

            return {
                message: 'Product retrieved successfully',
                product: [productResponse]
            };

        } catch (error) {
            throw new Error(`Failed to retrieve product: ${error.message}`);
        }

    }


}