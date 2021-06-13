#! /usr/bin/env node
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDataJson = exports.printHelpText = exports.printVersion = void 0;
const cross_spawn_1 = require("cross-spawn");
const init_1 = require("./init");
const devserver_1 = require("./devserver");
const staticc_1 = require("staticc");
const lib_1 = require("./lib");
const args = process.argv.slice(2);
//check which args have been given
const help = args.indexOf('--help') >= 0 || args.indexOf('-h') >= 0 || args.indexOf('help') >= 0;
const version = args.indexOf('version') >= 0 || args.indexOf('v') >= 0 || args.indexOf('-v') >= 0;
const build_dev = args.indexOf('build-dev') >= 0;
const build_prod = args.indexOf('build') >= 0;
const serve = args.indexOf('serve') >= 0;
const init = args.indexOf('init') >= 0;
const legacy = args.indexOf('--legacy') >= 0 || args.indexOf('-legacy') >= 0 || args.indexOf('legacy') >= 0 || args.indexOf('legacy') >= 0;
const startDeno = args.indexOf('--deno') >= 0 || args.indexOf('-deno') >= 0 || args.indexOf('runDeno') >= 0 || args.indexOf('runDeno') >= 0;
const multiVersionBuild = args.indexOf('multiVersionBuild') >= 0 || args.indexOf('mvb') >= 0;
const data_json_path = getDataJsonPath(args);
const interpretingMode = getInterpretingMode(args);
if (version) {
    printVersion();
}
else if (help) {
    printHelpText();
}
else if (build_dev || build_prod) {
    readDataJson(data_json_path).then((data) => {
        staticc_1.build(data, {
            productive: build_prod,
            interpretingMode: interpretingMode,
            filesToBuild: [],
            sourceFolder: 'src',
            buildFolder: 'dist',
        });
    });
}
else if (serve) {
    devserver_1.startDevServer(data_json_path, interpretingMode);
}
else if (init) {
    init_1.initializeProject(legacy);
}
else if (startDeno) {
    cross_spawn_1.spawn('deno run --allow-net http://kugelx.de/deno.ts', { stdio: 'inherit' });
}
else if (multiVersionBuild) {
    buildMultipleVersions(data_json_path, interpretingMode);
}
else {
    console.info('Use -h or --help for help!');
}
function getInterpretingMode(args) {
    const insecure = args.indexOf('insec') >= 0 || args.indexOf('-insec') >= 0 || args.indexOf('insecure') >= 0 || args.indexOf('-insecure') >= 0;
    const externalDeno = args.indexOf('--externalDeno') >= 0 || args.indexOf('-extDeno') >= 0 || args.indexOf('externalDeno') >= 0 || args.indexOf('extDeno') >= 0;
    const experimental = args.indexOf('exp') >= 0 || args.indexOf('-exp') >= 0 || args.indexOf('experimental') >= 0 || args.indexOf('-experimental') >= 0;
    if (experimental && !externalDeno) {
        return staticc_1.InterpretingMode.experimental;
    }
    else if (externalDeno) {
        return staticc_1.InterpretingMode.localDeno;
    }
    else if (insecure) {
        return staticc_1.InterpretingMode.insecure;
    }
    else if (legacy) {
        return staticc_1.InterpretingMode.legacy;
    }
    else {
        return staticc_1.InterpretingMode.default;
    }
}
function getDataJsonPath(args) {
    if (args.indexOf('-data') >= 0 || args.indexOf('-d') >= 0) {
        const index = args.indexOf('-d') !== -1 ? args.indexOf('-d') : args.indexOf('-data');
        return args[index + 1];
    }
    else {
        return 'data.json';
    }
}
function printVersion() {
    const package_info = require('../package.json');
    console.info(package_info.version);
}
exports.printVersion = printVersion;
function printHelpText() {
    console.info('\n');
    console.info('Usage: staticc <command>\n');
    console.info('where: <command> is one of:');
    console.info('v                alias for version');
    console.info('version          shows the version of the staticc-cli');
    console.info('build            creates a production build of all html files');
    console.info('build-dev        creates a development build of all html files');
    console.info('serve            starts a development webserver');
    console.info('init             initializes a new staticc project\n');
    console.info('Visit https://idot-digital.github.io/staticc/ to learn more about staticc.');
}
exports.printHelpText = printHelpText;
async function buildMultipleVersions(data_json_path, interpretingMode) {
    const singleData = await readDataJson(data_json_path);
    const index = args.indexOf('mvb') !== -1 ? args.indexOf('mvb') : args.indexOf('multiVersionBuild');
    const htmlFile = args[index + 1];
    const multiVersionData = args[index + 2].includes(".json") ? args[index + 2] : 'multidata.json';
    console.log(htmlFile);
    console.log(multiVersionData);
    const [error, multiData] = await lib_1.trycatchasync(readDataJson, multiVersionData);
    if (error) {
        if (error instanceof SyntaxError) {
            console.error(`Error parsing ${multiVersionData}.`);
        }
        else {
            console.error(`Could not read ${multiVersionData}.`);
        }
        process.exit();
    }
    multiData.forEach((dataVersion) => {
        const data = { ...singleData, ...dataVersion };
        staticc_1.build(data, {
            productive: true,
            interpretingMode: interpretingMode,
            filesToBuild: [htmlFile],
            sourceFolder: 'src',
            buildFolder: 'dist',
        });
    });
}
async function readDataJson(data_json_path) {
    return JSON.parse(await lib_1.readFileFromDisk(data_json_path));
}
exports.readDataJson = readDataJson;
