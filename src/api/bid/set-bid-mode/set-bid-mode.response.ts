export class SetBidModeResponse {

    message: string;

    bidMode: {
        userId: string;
        productId: string;
        bidMode: string;
        autoIncrementAmount?: number;
        createdAt: Date;
        updatedAt: Date;
    };

}
