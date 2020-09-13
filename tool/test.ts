import { generate } from "./generator";

const json: any = {};

generate(json, {
    outputDir: './test',
    events: {
        writingClientMethod: (method, bodyLines, context) => {
            const eventFieldName = `${method.name}Success`;
            bodyLines.splice(bodyLines.length- 1, 0, '\n\n// Emit event');
            bodyLines.splice(bodyLines.length- 1, 0, `this.${eventFieldName}.emit({ result });\n\n`);
        },
        writingClient: (client, context) => {
            client.importsSection.push(`import { EventEmitter } from 'event-emitter';`);
            client.methods.forEach(method => {
                const eventFieldName = `${method.name}Success`;

                let parameters = method.writeParameters(context);
                if (parameters) {
                    parameters += ', ';
                }

                client.fieldsSection.push(`${eventFieldName} = new EventEmitter<{ ${parameters}result: ${method.writeReturnType(context)} }>()`);
            });

        }
    }
});