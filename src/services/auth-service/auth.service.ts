import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { LoginRequest } from "src/api/auth/login/login.request";
import { LoginResponse } from "src/api/auth/login/login.response";
import { RegisterRequest } from "src/api/auth/register/register.request";
import { RegisterResponse } from "src/api/auth/register/register.response";
import { ConfigService } from "src/config/config.service";
import { UserRepositoryService } from "src/repositories/user-repository/user.repository";
import { UserRole } from "src/utils/enum";

@Injectable()
export class AuthService {

    constructor(
        private readonly userRepository: UserRepositoryService,
        private readonly configService: ConfigService,
    ) { }


    // Register API Endpoint
    async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {

        const { email, password, name, role } = registerRequest;

        // 1. Check if email already exists
        const emailExists = await this.userRepository.emailExists(email);
        if (emailExists) {
            throw new BadRequestException('Email already exists');
        }

        // 2. Allow only farmer and buyer to register
        const allowedRoles = [UserRole.FARMER, UserRole.BUYER];
        if (!allowedRoles.includes(role as UserRole)) {
            throw new BadRequestException('Invalid role. Only Farmer or Buyer can register.');
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const roleEnum = role as UserRole;

        // 4. Create user
        const newUser = await this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: roleEnum
        });

        return {
            message: 'User registered successfully',
            user: {
                id: newUser.id.toString(),
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },

        };
    }



    // Login API Endpoint
    async login(loginRequest: LoginRequest): Promise<LoginResponse> {

        const { email, password } = loginRequest;

        // 1. Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new BadRequestException('Invalid email or password');
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid email or password');
        }

        // 3. Generate JWT token directly using JWT
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, this.configService.getJWTSecretKey(), { expiresIn: this.configService.getJWTExpiresIn() });

        return {
            message: 'User login successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        };
    }



    // Verify JWT Token
    async verifyToken(token: string): Promise<User | null> {
        try {
            // Get the JWT secret from environment variables
            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) {
                console.error('JWT_SECRET is not defined in environment variables');
                return null;
            }

            // Verify the token manually
            const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

            // Extract the user ID from the payload
            const userId = payload.sub || payload.userId;

            if (!userId) {
                return null;
            }

            // Find the user in the database
            const user = await this.userModel.findById(userId);

            if (!user) {
                return null;
            }

            // Check if the token has been invalidated (e.g., user logged out)
            if (user.invalidatedTokens && user.invalidatedTokens.includes(token)) {
                return null;
            }

            // Return the user document
            return user;
        } catch (error) {
            // If token verification fails, return null
            console.error('Token verification failed:', error.message);
            return null;
        }
    }


}