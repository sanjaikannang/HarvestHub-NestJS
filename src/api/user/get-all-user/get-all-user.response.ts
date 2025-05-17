export class UserResponse {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export class PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export class GetAllUserResponse {

    message: string;

    pagination: PaginationInfo;

    user: UserResponse[];

}