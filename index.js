#!/usr/bin/env node
const { exec } = require('child_process');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const executeGenerator = require('./generator');

const pkg = require('./package.json');
program.version(pkg.version);

program
    .option('-c, --configuration <configuration>', 'Configuration File', 'openapi-typescript.config.js')
    .action(function (cmd) {
        console.log(pkg.version + '\n\n');

        if (!fs.existsSync(cmd.configuration)) {
            console.log('\x1b[31m%s\x1b[0m', '\n    Configuration file not found\n');
            program.outputHelp();
            return;
        }

        const config = require(path.resolve(cmd.configuration)); //JSON.parse(fs.readFileSync(cmd.configuration, 'utf8'));

        executeGenerator(/*config.url, config.outputDir*/config);
    });

const parsed = program.parse(process.argv);