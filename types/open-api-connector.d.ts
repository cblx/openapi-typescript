export declare interface OpenApiConnector {
    request: (method: string, path: string, parameters: any, body: any) => Promise<any>;
}