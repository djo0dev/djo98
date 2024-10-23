import { RequestContext } from '../api';
/**
 * @description
 * This service is used to cache arbitrary data relative to an ongoing request.
 * It does this by using a WeakMap bound to the current RequestContext, so the cached
 * data is available for the duration of the request. Once the request completes, the
 * cached data will be automatically garbage-collected.
 */
export declare class RequestContextCacheService {
    private caches;
    set<T = any>(ctx: RequestContext, key: any, val: T): void;
    get<T = any>(ctx: RequestContext, key: any): T | undefined;
    get<T>(ctx: RequestContext, key: any, getDefault?: () => T): T;
    private getContextCache;
    private isPromise;
}
