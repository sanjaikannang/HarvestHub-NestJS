export class RegisterResponse {

    success: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone?: string;
        address?: string;
        createdAt: Date;
    };
    message: string;
    
}