import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { LoginRequest } from "src/api/auth/login/login.request";
import { LoginResponse } from "src/api/auth/login/login.response";
import { RegisterRequest } from "src/api/auth/register/register.request";
import { RegisterResponse } from "src/api/auth/register/register.response";
import { UserRepositoryService } from "src/repositories/user-repository/user.repository";

@Injectable()
export class AuthService {

    // Hardcoded JWT secret key
    private readonly JWT_SECRET = "secret_key_12345";
    // JWT expiration time (24 hours)
    private readonly JWT_EXPIRES_IN = "24h";

    constructor(
        private readonly userRepository: UserRepositoryService,
    ) { }


    // Register API Endpoint
    async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        const { email, password, name, role } = registerRequest;

        // Check if email already exists
        const emailExists = await this.userRepository.emailExists(email);
        if (emailExists) {
            throw new ConflictException('Email already exists');
        }

        // Validate role
        if (!['admin', 'farmer', 'buyer'].includes(role)) {
            throw new BadRequestException('Invalid role. Must be admin, farmer, or buyer');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            role,
        });

        return {
            success: true,
            user: {
                id: newUser.id.toString(),
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            },
            message: 'User registered successfully'
        };
    }



    // Login API Endpoint
    async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        const { email, password } = loginRequest;

        // 1. Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // 3. Generate JWT token directly using jsonwebtoken
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });

        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: 'Login successful'
        };
    }

    // Verify token (useful for auth middleware)
    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

}