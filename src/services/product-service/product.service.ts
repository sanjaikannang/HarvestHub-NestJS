import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateProductRequest } from "src/api/user/create-product/create-product.request";
import { CreateProductResponse } from "src/api/user/create-product/create-product.response";
import { ConfigService } from "src/config/config.service";
import { Types } from "mongoose";
import { ProductRepositoryService } from "src/repositories/product-repository/product.repository";
import { GetAllProductRequest } from "src/api/user/get-all-product/get-all-product.request";
import { GetAllProductResponse, PaginationInfo } from "src/api/user/get-all-product/get-all-product.response";
import { ProductStatus } from "src/utils/enum";

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


    // Get All Product API Endpoint
    async getAllProduct(getAllProductRequest: GetAllProductRequest, userId: string, userRole: string): Promise<GetAllProductResponse> {

        try {
            const {
                page = 1,
                limit = 10,
                status,
                search,
            } = getAllProductRequest;

            // Build filter using repository service
            const filter = this.productRepository.buildProductFilter(
                status,
                search,
                userRole
            );

            // Calculate skip value for pagination
            const skip = (page - 1) * limit;

            // Get total count of products matching the filter
            const totalProducts = await this.productRepository.countProducts(filter);

            // Get products with pagination
            const products = await this.productRepository.findProducts(
                filter,
                skip,
                limit
            );

            // Get farmer names for each product
            const farmerIds = products.map(product => product.farmerId);
            const farmers = await this.userModel
                .find({ _id: { $in: farmerIds } })
                .select('_id firstName lastName')
                .lean();


            // Create a map of farmer IDs to names
            const farmerMap = {};
            farmers.forEach(farmer => {
                farmerMap[farmer._id.toString()] = `${farmer.firstName} ${farmer.lastName}`;
            });

            // Count bids for each product
            const productIds = products.map(product => product._id);
            const bidCounts = await this.bidModel.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: '$productId', count: { $sum: 1 } } }
            ]);

            // Create a map of product IDs to bid counts
            const bidCountMap = {};
            bidCounts.forEach(item => {
                bidCountMap[item._id.toString()] = item.count;
            });


            // Format products with additional information
            const formattedProducts = products.map(product => {
                const productId = product._id.toString();
                return {
                    ...product,
                    _id: productId,
                    farmerName: farmerMap[product.farmerId.toString()] || 'Unknown Farmer',
                    bidsCount: bidCountMap[productId] || 0
                };
            });

            // Create pagination information using repository method
            const pagination = this.productRepository.createPaginationInfo(
                page,
                limit,
                totalProducts
            );

            return {
                message: "Products fetched successfully",
                count: formattedProducts.length,
                pagination,
                products: formattedProducts
            };


        } catch (error) {
            return {
                message: `Error fetching products: ${error.message}`,
                count: 0,
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalProducts: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                },
                products: [],
            };
        }
    }

}