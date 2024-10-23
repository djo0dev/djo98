"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginStartupMessages = exports.registerPluginStartupMessage = exports.createProxyHandler = void 0;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const config_1 = require("../config");
/**
 * @description
 * Creates a proxy middleware which proxies the given route to the given port.
 * Useful for plugins which start their own servers but should be accessible
 * via the main Vendure url.
 *
 * @example
 * ```ts
 * // Example usage in the `configuration` method of a VendurePlugin.
 * // Imagine that we have started a Node server on port 5678
 * // running some service which we want to access via the `/my-plugin/`
 * // route of the main Vendure server.
 * \@VendurePlugin({
 *   configuration: (config: Required<VendureConfig>) => {
 *       config.apiOptions.middleware.push({
 *           handler: createProxyHandler({
 *               label: 'Admin UI',
 *               route: 'my-plugin',
 *               port: 5678,
 *           }),
 *           route: 'my-plugin',
 *       });
 *       return config;
 *   }
 * })
 * export class MyPlugin {}
 * ```
 *
 * @docsCategory Plugin
 * @docsPage Plugin Utilities
 */
function createProxyHandler(options) {
    const route = options.route.charAt(0) === '/' ? options.route : '/' + options.route;
    const proxyHostname = options.hostname || 'localhost';
    const middleware = (0, http_proxy_middleware_1.createProxyMiddleware)({
        // TODO: how do we detect https?
        target: `http://${proxyHostname}:${options.port}`,
        pathRewrite: {
            [`^${route}`]: '/' + (options.basePath || ''),
        },
        logProvider(provider) {
            return {
                log(message) {
                    config_1.Logger.debug(message, options.label);
                },
                debug(message) {
                    config_1.Logger.debug(message, options.label);
                },
                info(message) {
                    config_1.Logger.debug(message, options.label);
                },
                warn(message) {
                    config_1.Logger.warn(message, options.label);
                },
                error(message) {
                    config_1.Logger.error(message, options.label);
                },
            };
        },
    });
    return middleware;
}
exports.createProxyHandler = createProxyHandler;
const pluginStartupMessages = [];
/**
 * Use this function to add a line to the bootstrap log output listing a service added
 * by this plugin.
 */
function registerPluginStartupMessage(serviceName, path) {
    pluginStartupMessages.push({ label: serviceName, path });
}
exports.registerPluginStartupMessage = registerPluginStartupMessage;
function getPluginStartupMessages() {
    return pluginStartupMessages;
}
exports.getPluginStartupMessages = getPluginStartupMessages;
//# sourceMappingURL=plugin-utils.js.map