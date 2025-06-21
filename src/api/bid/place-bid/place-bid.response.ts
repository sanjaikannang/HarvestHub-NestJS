export class PlaceBidResponse {

    message: string;

    bid?: {
        bidId: string;
        productId: string;
        bidderId: string;
        bidAmount: number;
        bidTime: Date;
        isWinningBid: boolean;
        bidStatus: string;
        bidType?: string;
    };

}