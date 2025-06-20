export class BidDisplayInfo {
    // Basic bid information
    bidId: string;
    productId: string;
    bidderId: string;
    bidderName?: string;
    bidderInitials: string; 

    // Amount information for UI display
    currentBidAmount: number;     // ₹95,000 (current bid)
    previousBidAmount: number;    // ₹90,000 (previous bid)
    incrementAmount: number;      // ₹5,000 (increase from previous)

    // Time information
    bidTime: Date;
    timeAgo: string;             // "2 min ago", "5 min ago", etc.

    // Status information
    isWinningBid: boolean;
    bidStatus: string;

}


export class GetAllBidsResponse {

    message: string;

    totalBids: number;
    highestBid: number;
    startingPrice: number;

    bids: BidDisplayInfo[];

}