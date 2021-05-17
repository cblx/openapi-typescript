import { ClientType } from './client-type';
import { ClientMethod } from './client-method';
import { TypeContext } from './type-context';
import { ClientMethodOld } from './client-method-old';

export interface OpenApiTypeScriptConfig {
    url?: string;
    outputDir?: string;
    hooks?: {
        /**
         * Allow to intercept and change write parts of API client classes
         */
        writingClient?: (client: ClientType, context: TypeContext) => any,
        /**
         * Allow to intercept and change write partes of API client functions
         */
        writingClientMethod?: (method: ClientMethod | ClientMethodOld, bodyLines: string[], context: TypeContext) => any
    },
    generateComponents?: {
        /**
         * Generate a definition.ts file exporting
         * a const with the full openapi definition
         */
        definitionConst?: boolean,
        /**
         * Generate a schemas.ts file exporting
         * a const with the full components/schemas 
         * part of the openapi definition
         */
        schemasConst?: boolean
    },
    models?: {
        [modelId: string]: {
            /**
             * Extends the type including metadata static fields
             * with the type and it's fields names
             */
            generateMetadata?: boolean
        }
    }
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
            /**
             * Use function formats used in v0.17 and previous versions of this tool
             * This option may be removed in the future.
             */
            oldMode: boolean
        },
    }
}