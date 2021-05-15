import { ClientType } from './client-type';
import { ClientMethod } from './client-method';
import { TypeContext } from './type-context';
import { ClientMethodOld } from './client-method-old';

export interface OpenApiTypeScriptConfig {
    url?: string;
    outputDir?: string;
    hooks?: {
        writingClient?: (client: ClientType, context: TypeContext) => any,
        writingClientMethod?: (method: ClientMethod | ClientMethodOld, bodyLines: string[], context: TypeContext) => any
    },
    /**
     * ex:
     * {
     *      default: { oldMode: true },
     *      MyClientId: { oldMode: false },
     *      MyClient2Id: { oldMode: false }
     * }
     */
    clients?: {
        [clientId: string ]: {
            oldMode: boolean
        },
    }
}