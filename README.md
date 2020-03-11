# openapi-typescript
openapi client generator for typescript


openapi-typescript.config.js

```
var config = {
    url: "<url>/swagger.json",
    outputDir: "./src/client",
    events: {
        beforeWriteServiceClass: () => {
            var content = '';
            content += `import { Inject, Injectable } from '@angular/core';\n`;
            content += `import { OpenApiConnector } from '../app/open-api-connector/open-api-connector';\n`;
            content += `@Injectable({ providedIn: 'root' })\n`;
            return content;
        },
        createConnectorDecorator: () => {
            return `@Inject(OpenApiConnector) `;
        }
    }
};

module.exports = config;
```
