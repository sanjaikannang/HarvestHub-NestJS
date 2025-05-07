export class LoginResponse {
    
    accessToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone?: string;
        address?: string;
    };
    message: string;
    
}