"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationTokenGenerator = void 0;
const common_1 = require("@nestjs/common");
const ms_1 = __importDefault(require("ms"));
const generate_public_id_1 = require("../../../common/generate-public-id");
const config_service_1 = require("../../../config/config.service");
/**
 * This class is responsible for generating and verifying the tokens issued when new accounts are registered
 * or when a password reset is requested.
 */
let VerificationTokenGenerator = class VerificationTokenGenerator {
    constructor(configService) {
        this.configService = configService;
    }
    /**
     * Generates a verification token which encodes the time of generation and concatenates it with a
     * random id.
     */
    generateVerificationToken() {
        const now = new Date();
        const base64Now = Buffer.from(now.toJSON()).toString('base64');
        const id = (0, generate_public_id_1.generatePublicId)();
        return `${base64Now}_${id}`;
    }
    /**
     * Checks the age of the verification token to see if it falls within the token duration
     * as specified in the VendureConfig.
     */
    verifyVerificationToken(token) {
        const { verificationTokenDuration } = this.configService.authOptions;
        const verificationTokenDurationInMs = typeof verificationTokenDuration === 'string'
            ? (0, ms_1.default)(verificationTokenDuration)
            : verificationTokenDuration;
        const [generatedOn] = token.split('_');
        const dateString = Buffer.from(generatedOn, 'base64').toString();
        const date = new Date(dateString);
        const elapsed = +new Date() - +date;
        return elapsed < verificationTokenDurationInMs;
    }
};
exports.VerificationTokenGenerator = VerificationTokenGenerator;
exports.VerificationTokenGenerator = VerificationTokenGenerator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], VerificationTokenGenerator);
//# sourceMappingURL=verification-token-generator.js.map