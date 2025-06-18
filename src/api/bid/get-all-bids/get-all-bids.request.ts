export class GetAllBidsRequest {

    // Optional query parameters for filtering/pagination
    page?: number = 1;
    limit?: number = 10;
    sortBy?: 'bidAmount' | 'bidTime' = 'bidTime';
    sortOrder?: 'asc' | 'desc' = 'desc';
    bidStatus?: string; // Optional filter by bid status

}