export class ProductResponse {
    _id: string;
    name: string;
    description: string;
    farmerId: string;
    farmerName?: string;  // Populated from User collection
    quantity: {
        value: number;
        unit: string;
    };
    images: string[];
    startingPrice: number;
    currentHighestBid: number;
    bidStartDate: Date;
    bidEndDate: Date;
    bidStartTime: Date;
    bidEndTime: Date;
    productStatus: string;
    createdAt: Date;
    updatedAt: Date;
}


export class PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export class GetAllProductResponse {

    message: string;

    count: number;

    pagination: PaginationInfo;

    product: ProductResponse[]

}
