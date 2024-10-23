import { ConfigService } from '../../../config/config.service';
/**
 * This class is responsible for generating and verifying the tokens issued when new accounts are registered
 * or when a password reset is requested.
 */
export declare class VerificationTokenGenerator {
    private configService;
    constructor(configService: ConfigService);
    /**
     * Generates a verification token which encodes the time of generation and concatenates it with a
     * random id.
     */
    generateVerificationToken(): string;
    /**
     * Checks the age of the verification token to see if it falls within the token duration
     * as specified in the VendureConfig.
     */
    verifyVerificationToken(token: string): boolean;
}
