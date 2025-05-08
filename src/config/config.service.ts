import * as dotenv from "dotenv";

export class ConfigService {

    constructor() {
        dotenv.config({
            path: `.env`,
        });
    }


    private getValue(key: string, throwOnMissing = true): string {
        const value = process.env[key];
        if (!value && throwOnMissing) {
            throw new Error(`config error - missing environment variable: ${key}`);
        }

        return value || '';
    }


    getPort() {
        return this.getValue("PORT", true);
    }

    getFrontEndBaseUrl() {
        return this.getValue("FRONT_END_BASE_URL", true);
    }

    getMongoDbUri() {
        return this.getValue("MONGODB_URL");
    }

    getJWTSecretKey() {
        return this.getValue("JWT_SECRET_KEY");
    }


}