export class UserResponse {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export class GetSpecificUserResponse {

    message: string;

    user: UserResponse[]

}