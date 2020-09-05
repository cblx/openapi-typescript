export abstract class OpenApiConnector {
    abstract request(method: string, path: string, parameters: any, body: any): Promise<any>;
}