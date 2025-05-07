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

    getBaseUrl() {
        return this.getValue("FRONT_END_BASE_URL", true);
    }

    getMongoDbUri() {
        const mongoDbUrl = this.getValue("MONGODB_URL", true);

        // console.log("MongoDB URL: ", mongoDbUrl);

        return this.getValue("MONGODB_URL");
    }


}