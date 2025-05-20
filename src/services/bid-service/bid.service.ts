import { Injectable } from "@nestjs/common";
import { PlaceBidRequest } from "src/api/bid/place-bid/place-bid.request";
import { PlaceBidResponse } from "src/api/bid/place-bid/place-bid.response";

@Injectable()
export class BidService {

    constructor() { }


    // Place Bid API endpoint
    async placeBid(placeBidRequest: PlaceBidRequest, userId: string): Promise<PlaceBidResponse> {

        try {
            const { productId, bidderId, bidAmount } = createBidDto;

            // Validate product exists and is open for bidding
            const product = await this.productModel.findById(productId);
            if (!product) {
                return { error: 'Product not found' };
            }

            // Check if auction is active
            const now = new Date();
            if (now < product.bidStartDate || now > product.bidEndDate) {
                return { error: 'Auction is not active at this time' };
            }

            // Check if product is approved for auction
            if (product.productStatus !== ProductStatus.APPROVED) {
                return { error: 'This product is not approved for auction' };
            }

            // Validate user exists and is a buyer
            const bidder = await this.userModel.findById(bidderId);
            if (!bidder) {
                return { error: 'Bidder not found' };
            }

            if (bidder.role !== UserRole.BUYER) {
                return { error: 'Only buyers can place bids' };
            }

            // Check if user is not the farmer of this product
            if (product.farmerId.toString() === bidderId) {
                return { error: 'You cannot bid on your own product' };
            }

            // Validate bid amount
            if (bidAmount <= 0) {
                return { error: 'Bid amount must be positive' };
            }

            // Ensure bid is higher than starting price
            if (bidAmount < product.startingPrice) {
                return { error: `Bid must be at least ${product.startingPrice}` };
            }

            // Ensure bid is higher than current highest bid
            if (product.currentHighestBid && bidAmount <= product.currentHighestBid) {
                return { error: `Bid must be higher than current highest bid: ${product.currentHighestBid}` };
            }

            // Create new bid
            const newBid = new this.bidModel({
                productId: new Types.ObjectId(productId),
                bidderId: new Types.ObjectId(bidderId),
                bidAmount,
                bidTime: new Date(),
                bidStatus: BidStatus.ACTIVE,
            });

            // Save the bid
            const savedBid = await newBid.save();

            // Update product with new highest bid
            await this.productModel.findByIdAndUpdate(productId, {
                currentHighestBid: bidAmount,
                currentHighestBidderId: new Types.ObjectId(bidderId),
            });

            return savedBid;
        } catch (error) {
            console.error('Error creating bid:', error);
            return { error: 'Failed to place bid' };
        }

    }


    //
    async getBidsForProduct() {

    }


    async getAuctionState(productId: string) {
        const product = await this.productModel.findById(productId)
            .populate('farmerId', 'name email')
            .populate('currentHighestBidderId', 'name');

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Get all bids for this product, sorted by amount desc
        const bids = await this.bidModel.find({ productId: new Types.ObjectId(productId) })
            .sort({ bidAmount: -1 })
            .populate('bidderId', 'name')
            .limit(10); // Limit to top 10 bids

        // Check if auction is active
        const now = new Date();
        const isActive = now >= product.bidStartDate && now <= product.bidEndDate;

        // Time remaining calculation
        let timeRemaining = null;
        if (isActive) {
            timeRemaining = Math.max(0, product.bidEndDate.getTime() - now.getTime());
        }

        return {
            product: {
                _id: product._id,
                name: product.name,
                description: product.description,
                images: product.images,
                startingPrice: product.startingPrice,
                currentHighestBid: product.currentHighestBid,
                currentHighestBidder: product.currentHighestBidderId
                    ? {
                        _id: product.currentHighestBidderId._id,
                        name: product.currentHighestBidderId.name
                    }
                    : null,
                farmer: {
                    _id: product.farmerId._id,
                    name: product.farmerId.name
                },
                bidStartDate: product.bidStartDate,
                bidEndDate: product.bidEndDate,
                quantity: product.quantity,
            },
            bids: bids.map(bid => ({
                _id: bid._id,
                bidder: {
                    _id: bid.bidderId._id,
                    name: bid.bidderId.name,
                },
                amount: bid.bidAmount,
                time: bid.bidTime,
            })),
            auctionStatus: {
                isActive,
                timeRemaining,
            }
        };
    }

    async getBidsForProduct(productId: string) {
        return this.bidModel
            .find({ productId: new Types.ObjectId(productId) })
            .sort({ bidAmount: -1 })
            .populate('bidderId', 'name email')
            .exec();
    }

    async getUserBids(userId: string) {
        return this.bidModel
            .find({ bidderId: new Types.ObjectId(userId) })
            .sort({ bidTime: -1 })
            .populate({
                path: 'productId',
                select: 'name images currentHighestBid currentHighestBidderId bidEndDate',
            })
            .exec();
    }

    async getFarmerProductBids(farmerId: string) {
        // First, get all products by this farmer
        const farmerProducts = await this.productModel
            .find({ farmerId: new Types.ObjectId(farmerId) })
            .select('_id');

        const productIds = farmerProducts.map(product => product._id);

        // Then get bids for those products
        return this.bidModel
            .find({ productId: { $in: productIds } })
            .sort({ bidTime: -1 })
            .populate('bidderId', 'name email')
            .populate('productId', 'name images currentHighestBid bidEndDate')
            .exec();
    }

    async endAuction(productId: string) {
        const product = await this.productModel.findById(productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Check if there's a winning bid
        if (product.currentHighestBid && product.currentHighestBidderId) {
            // Update product status
            product.productStatus = ProductStatus.SOLD;
            await product.save();

            // Update winning bid
            await this.bidModel.findOneAndUpdate(
                {
                    productId: new Types.ObjectId(productId),
                    bidderId: product.currentHighestBidderId
                },
                { isWinningBid: true }
            );

            return {
                status: 'completed',
                winningBid: product.currentHighestBid,
                winnerId: product.currentHighestBidderId,
            };
        } else {
            // No bids were placed
            product.productStatus = ProductStatus.NO_BIDS;
            await product.save();

            return {
                status: 'completed',
                winningBid: null,
                winnerId: null,
                message: 'No bids were placed for this auction'
            };
        }
    }

    // Scheduled job to automatically end auctions
    async checkAndEndExpiredAuctions() {
        const now = new Date();

        // Find all products where auction has ended but status is still pending
        const expiredAuctions = await this.productModel.find({
            bidEndDate: { $lt: now },
            productStatus: ProductStatus.APPROVED,
        });

        console.log(`Found ${expiredAuctions.length} expired auctions to process`);

        for (const auction of expiredAuctions) {
            await this.endAuction(auction._id.toString());
        }

        return `Processed ${expiredAuctions.length} expired auctions`;
    }


}