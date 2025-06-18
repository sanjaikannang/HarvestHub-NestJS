export class GetAllBidsResponse {

    message: string;
    bids: {
        bidId: string;
        productId: string;
        bidderId: string;
        bidderName?: string; // Optional: if you want to include bidder details
        bidAmount: number;
        bidTime: Date;
        isWinningBid: boolean;
        bidStatus: string;
    }[];
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalBids: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    
}