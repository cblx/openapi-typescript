# openapi-typescript
openapi client generator for typescript

`npm install @cblx-br/openapi-typescript --save-dev`


create an openapi-typescript.config.js

```
var config = {
    url: "<url>/swagger.json",
    outputDir: "./src/client",
};

module.exports = config;
```

execute it:

`npx openapi-typescript`

Then create an implementation for your connector using the tool of your choice (fetch, jquery ajax, etc...).

```
export class MyAppConnector implements OpenApiConnector {
     async request(method: string, path: string, parameters: any, body: any) {
         ... implementation ...
     }
}
```
Use your connector with your client api service.
```
var myApi = new MyApiClient(new MyAppConnector());
let result = await myApi.get();
```
-------------

## Angular example:

create an app-connector.ts

```
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OpenApiConnector } from '@cblx-br/openapi-typescript';

@Injectable({
    providedIn: 'root'
})
export class AppConnector implements OpenApiConnector {

    constructor(private http: HttpClient) {}

    async request(method: string, path: string, parameters: any, body: any) {
        return await this.http.request(method, '/' + path, {
            body: body,
            params: parameters
        }).toPromise();
    }
}

```

app.module.ts
```
@NgModule({
  declarations: [...],
  imports: [
    ...
    HttpClientModule
  ],
  providers: [
    {
      provide: OpenApiConnector,
      useClass: AppConnector
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

openapi-typescript.config.js

```
var config = {
    url: "<url>/swagger.json",
    outputDir: "./src/client",
     events: {
        interceptServiceClass(serviceClass){
            serviceClass.importsSection.push(`import { Injectable, EventEmitter } from '@angular/core';`);
            serviceClass.decoratorsSection.push(`@Injectable({ providedIn: 'root' })`);
            // Eventing
            serviceClass.methods.forEach(method => {
                const eventFieldName = `${method.name}Success`;
                serviceClass.fieldsSection.push(`${eventFieldName} = new EventEmitter<${method.returnType}>()`);
                method.body = method.body.replace('return ', 'const promise = ');
                method.body += '\n';
                method.body += 'const result = await promise;\n\n';
                method.body += '// Emit success\n';
                method.body += `this.${eventFieldName}.emit(result);\n\n`;
                method.body += 'return result;'
            });
        }
    }
};

module.exports = config;
```
