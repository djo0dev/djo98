import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '../../config/config.service';
/**
 * This interceptor is responsible for enforcing the validation constraints defined for any CustomFields.
 * For example, if a custom 'int' field has a "min" value of 0, and a mutation attempts to set its value
 * to a negative integer, then that mutation will fail with an error.
 */
export declare class ValidateCustomFieldsInterceptor implements NestInterceptor {
    private configService;
    private moduleRef;
    private readonly inputsWithCustomFields;
    constructor(configService: ConfigService, moduleRef: ModuleRef);
    intercept(context: ExecutionContext, next: CallHandler<any>): Promise<import("rxjs").Observable<any>>;
    private validateInput;
    private validateCustomFieldsObject;
    private getArgumentMap;
    private getNamedTypeName;
    private getInputTypeName;
}
