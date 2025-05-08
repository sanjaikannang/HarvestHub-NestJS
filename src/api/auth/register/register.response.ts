export class RegisterResponse {

    message: string;

    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };

}