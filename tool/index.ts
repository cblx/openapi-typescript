#!/usr/bin/env node
import { Command } from 'commander'; 
import * as fs from 'fs';
import colors from 'chalk';
import * as path from 'path';
import { createRequire } from "module";
import { generateFromEndpoint } from './generator.js';
//import * as pkg from '../package.json';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();
program.version(pkg.version);

program
    .option('-c, --configuration <configuration>', 'Configuration File', 'openapi-typescript.config.js')
    .action(function (cmd) {
        console.log();
        console.log('\x1b[32m%s\x1b[0m', "@cblx/openapi-typescript");
        console.log(colors.gray(pkg.version + '\n\n'));
        console.log();

        if (!fs.existsSync(cmd.configuration)) {
            console.log('\x1b[31m%s\x1b[0m', '\n    Configuration file not found\n');
            program.outputHelp();
            return;
        }

        //const config = import(path.resolve(cmd.configuration));
        //const configContent = fs.readFileSync(path.resolve(cmd.configuration)).toString();
        //console.log(configContent);
        //const config = JSON.parse(configContent);

        import('file://' + path.resolve(cmd.configuration))
            .then(mod => generateFromEndpoint(mod.default));
        //generateFromEndpoint(config);
    });

const parsed = program.parse(process.argv);