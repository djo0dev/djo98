import { DynamicModule } from '@nestjs/common';
import { Type } from '@vendure/common/lib/shared-types';
/**
 * This function dynamically creates a Nest module to house any GraphQL resolvers defined by
 * any configured plugins.
 */
export declare function createDynamicGraphQlModulesForPlugins(apiType: 'shop' | 'admin'): DynamicModule[];
/**
 * This function retrieves any dynamic modules which were created with createDynamicGraphQlModulesForPlugins.
 */
export declare function getDynamicGraphQlModulesForPlugins(apiType: 'shop' | 'admin'): Array<Type<any>>;
