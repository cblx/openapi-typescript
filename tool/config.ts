import { ClientType } from './client-type.js';
import { ClientMethod } from './client-method.js';
import { TypeContext } from './type-context.js';
import { ClientMethodOld } from './client-method-old.js';
import { GenerateSchemaFileOptions } from './generate-schema-file-options.js';
import { SchemaTypeBase } from './schema-type-base.js';
export interface OpenApiTypeScriptConfig {
    url?: string;
    outputDir?: string;
    hooks?: {
        /**
         * Allow to intercept and change write parts of API client classes
         */
        writingClient?: (client: ClientType, context: TypeContext) => any,
        /**
         * Allow to intercept and change write parts of API client functions
         */
        writingClientMethod?: (method: ClientMethod | ClientMethodOld, bodyLines: string[], context: TypeContext) => any,
        /**
         * Allow to create other custom files for each model/enum
         */
        generatingModelFiles?: (type: SchemaTypeBase) => { [fileName: string ]: string }
    },
    generateComponents?: {
        /**
         * Generate an index.ts files that
         * exports all files in each dir
         */
        index?: boolean,
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
             * (use 'default' to apply option to all models)
             */
            generateMetadata?: boolean,
            /**
             * Generate a file <model>.meta.ts
             * containing information about
             * the type and it's fields names
             */
            generateMetadataFile?: boolean,
            /**
             * Generate a file <model>.schema.ts
             * containing the correspondent openapi schema
             */
            generateSchemaFile?:boolean | GenerateSchemaFileOptions
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