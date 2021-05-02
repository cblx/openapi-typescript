#!/usr/bin/env node
import * as program from 'commander';
import * as fs from 'fs';
import * as colors from 'colors';
import * as path from 'path';
import { generateFromEndpoint } from './generator';

const pkg = require('../package.json');
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

        const config = require(path.resolve(cmd.configuration));

        generateFromEndpoint(config);
    });

const parsed = program.parse(process.argv);