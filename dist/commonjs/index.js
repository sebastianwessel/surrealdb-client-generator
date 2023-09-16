#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const commander_1 = require("commander");
const configFileSchema_js_1 = require("./config/configFileSchema.js");
const db_js_1 = require("./database/db.js");
const generateClient_js_1 = require("./genClient/generateClient.js");
const generateTableSchema_js_1 = require("./genSchema/generateTableSchema.js");
const printSorry_js_1 = require("./helper/printSorry.js");
const main = async () => {
    commander_1.program
        .name('surql-gen')
        .description('Generate zod schema and typescript client code from running Surreal database')
        .version('1.0.0');
    commander_1.program
        .option('-f, --file [schemaFile]', 'a SurrealQL file containing the definitions', 'myschema.surql')
        .option('-c, --config [configFile]', 'SurrealDB connection url', 'surql-gen.json')
        .option('-s, --surreal [surreal]', 'SurrealDB connection url', 'ws://127.0.0.1:8000')
        .option('-u, --username [username]', 'auth username', 'root')
        .option('-p, --password [password]', 'auth password', 'root')
        .option('-n, --ns [ns]', 'the namspace', 'test')
        .option('-d, --db [db]', 'the database', 'test')
        .option('-o, --outputFolder [outputFolder]', 'output folder', 'client_generated')
        .option('-g, --generateClient [generateClient]', 'generate client', true);
    commander_1.program.parse();
    const options = commander_1.program.opts();
    const __dirname = process.cwd();
    if (!options.configFile) {
        console.log('No config file provided - looking for surql-gen.json in current folder');
    }
    const configFilePath = (0, node_path_1.resolve)(__dirname, options.configFile || 'surql-gen.json');
    let fileContent = {};
    try {
        const content = await (0, promises_1.readFile)(configFilePath);
        fileContent = JSON.parse(content.toString());
    }
    catch (error) {
        const err = error;
        if (err.code === 'ENOENT') {
            console.log('No config file found.');
        }
        else {
            console.error('');
            console.error('Please have a look at your config file!');
            console.error('Looks like, your configuration file is invalid.');
            console.error('');
            throw new Error('Invalid configuration: ' + err.message);
        }
    }
    const config = configFileSchema_js_1.configFileSchema.parse({ ...fileContent, ...options });
    await (0, db_js_1.connectDb)(config);
    if (config.schemaFile) {
        const schemaFilePath = (0, node_path_1.resolve)(__dirname, config.schemaFile);
        let surQLContent;
        try {
            surQLContent = await (0, promises_1.readFile)(schemaFilePath);
        }
        catch (error) {
            const err = error;
            if (err.code === 'ENOENT') {
                console.error('');
                console.error('Unable to find schema file', schemaFilePath);
                console.error('Please check!');
                console.error('');
                process.exit(1);
            }
            else {
                console.error('');
                console.error('Please have a look at your config file!');
                console.error('Looks like, your configuration file is invalid.');
                console.error('');
                throw new Error('Invalid configuration: ' + err.message);
            }
        }
        try {
            await (0, db_js_1.insertDefinitions)(surQLContent.toString());
        }
        catch (error) {
            (0, printSorry_js_1.printSorry)(error);
            process.exit(1);
        }
    }
    try {
        await (0, generateTableSchema_js_1.generateTableSchema)((0, node_path_1.resolve)(__dirname, config.outputFolder));
        if (config.generateClient) {
            await (0, generateClient_js_1.generateClient)((0, node_path_1.resolve)(__dirname, config.outputFolder));
        }
    }
    catch (error) {
        (0, printSorry_js_1.printSorry)(error);
        process.exit(1);
    }
    await (0, db_js_1.closeDb)();
    console.log('');
    console.log('');
    console.log('Thanks for using my tool');
    console.log('');
    console.log('Please 🙏 give a star ⭐️ on github: 👉 https://github.com/sebastianwessel/surrealdb-client-generator');
    console.log('');
    console.log('If you run into an issue, please let me know so it can get fixed.');
    console.log('👉 https://github.com/sebastianwessel/surrealdb-client-generator/issues');
    console.log('');
    console.log('Good luck with your project. 👋 Cheers, and happy coding!');
    console.log('');
};
main();
//# sourceMappingURL=index.js.map