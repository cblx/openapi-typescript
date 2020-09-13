import { ClientType } from './client-type';
import { ClientMethod } from './client-method';
import { TypeContext } from './type-context';

export interface OpenApiTypeScriptConfig {
    url?: string;
    outputDir?: string;
    events?: {
        writingClient?: (client: ClientType, context: TypeContext) => any,
        writingClientMethod?: (method: ClientMethod, bodyLines: string[], context: TypeContext) => any
    }
}