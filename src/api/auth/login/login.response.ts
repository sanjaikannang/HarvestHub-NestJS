import { UserRole } from "src/utils/enum";

export class LoginResponse {
    
    message: string;
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    
}