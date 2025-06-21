export class GetBidModeResponse {

    message: string;

    bidMode?: {
        userId: string;
        productId: string;
        bidMode: string;
        autoIncrementAmount?: number;     
    };

}