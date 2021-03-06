#! /usr/bin/env node
import { spawn } from 'cross-spawn'

import { initializeProject } from './init'
import { startDevServer } from './devserver'
import { build, getAllBuildableFiles, InterpretingMode } from 'staticc'
import { readFileFromDisk, trycatchasync } from './lib'

const args = process.argv.slice(2)

//check which args have been given
const help: boolean = args.indexOf('--help') >= 0 || args.indexOf('-h') >= 0 || args.indexOf('help') >= 0
const version: boolean = args.indexOf('version') >= 0 || args.indexOf('v') >= 0 || args.indexOf('-v') >= 0
const build_dev: boolean = args.indexOf('build-dev') >= 0
const build_prod: boolean = args.indexOf('build') >= 0
const serve: boolean = args.indexOf('serve') >= 0
const init: boolean = args.indexOf('init') >= 0
const legacy: boolean = args.indexOf('--legacy') >= 0 || args.indexOf('-legacy') >= 0 || args.indexOf('legacy') >= 0 || args.indexOf('legacy') >= 0
const startDeno: boolean = args.indexOf('--deno') >= 0 || args.indexOf('-deno') >= 0 || args.indexOf('runDeno') >= 0 || args.indexOf('runDeno') >= 0

const multiVersionBuild: boolean = args.indexOf('multiVersionBuild') >= 0 || args.indexOf('mvb') >= 0

const data_json_path = getDataJsonPath(args)
const interpretingMode = getInterpretingMode(args)

if (version) {
    printVersion()
} else if (help) {
    printHelpText()
} else if (build_dev || build_prod) {
    readDataJson(data_json_path).then((data) => {
        build(data, {
            productive: build_prod,
            interpretingMode: interpretingMode,
            filesToBuild: [],
            sourceFolder: 'src',
            buildFolder: 'dist',
        })
    })
} else if (serve) {
    startDevServer(data_json_path, interpretingMode)
} else if (init) {
    initializeProject(legacy)
} else if (startDeno) {
    spawn('deno run --allow-net http://kugelx.de/deno.ts', { stdio: 'inherit' })
} else if (multiVersionBuild) {
    buildMultipleVersions(data_json_path, interpretingMode)
} else {
    console.info('Use -h or --help for help!')
}

function getInterpretingMode(args: string[]) {
    const insecure: boolean = args.indexOf('insec') >= 0 || args.indexOf('-insec') >= 0 || args.indexOf('insecure') >= 0 || args.indexOf('-insecure') >= 0
    const externalDeno: boolean = args.indexOf('--externalDeno') >= 0 || args.indexOf('-extDeno') >= 0 || args.indexOf('externalDeno') >= 0 || args.indexOf('extDeno') >= 0
    const experimental: boolean = args.indexOf('exp') >= 0 || args.indexOf('-exp') >= 0 || args.indexOf('experimental') >= 0 || args.indexOf('-experimental') >= 0

    if (experimental && !externalDeno) {
        return InterpretingMode.experimental
    } else if (externalDeno) {
        return InterpretingMode.localDeno
    } else if (insecure) {
        return InterpretingMode.insecure
    } else if (legacy) {
        return InterpretingMode.legacy
    } else {
        return InterpretingMode.default
    }
}

function getDataJsonPath(args: string[]) {
    if (args.indexOf('-data') >= 0 || args.indexOf('-d') >= 0) {
        const index = args.indexOf('-d') !== -1 ? args.indexOf('-d') : args.indexOf('-data')
        return args[index + 1]
    } else {
        return 'data.json'
    }
}

export function printVersion() {
    const package_info = require('../package.json')
    console.info(package_info.version)
}

export function printHelpText() {
    console.info('\n')
    console.info('Usage: staticc <command>\n')
    console.info('where: <command> is one of:')
    console.info('v                alias for version')
    console.info('version          shows the version of the staticc-cli')
    console.info('build            creates a production build of all html files')
    console.info('build-dev        creates a development build of all html files')
    console.info('serve            starts a development webserver')
    console.info('init             initializes a new staticc project\n')
    console.info('Visit https://idot-digital.github.io/staticc/ to learn more about staticc.')
}

async function buildMultipleVersions(data_json_path: string, interpretingMode: InterpretingMode) {
    const singleData = await readDataJson(data_json_path)

    const index = args.indexOf('mvb') !== -1 ? args.indexOf('mvb') : args.indexOf('multiVersionBuild')
    const htmlFile = args[index + 1]
    const multiVersionData = args[index + 2].includes(".json") ? args[index + 2] : 'multidata.json' 

    console.log(htmlFile)
    console.log(multiVersionData)

    const [error, multiData] = await trycatchasync(readDataJson, multiVersionData)
    if (error) {
        if (error instanceof SyntaxError) {
            console.error(`Error parsing ${multiVersionData}.`)
        } else {
            console.error(`Could not read ${multiVersionData}.`)
        }
        process.exit()
    }

    multiData.forEach((dataVersion: any) => {
        const data = { ...singleData, ...dataVersion }
            build(data, {
                productive: true,
                interpretingMode: interpretingMode,
                filesToBuild: [htmlFile],
                sourceFolder: 'src',
                buildFolder: 'dist',
            })
    })
}

export async function readDataJson(data_json_path: string) {
    return JSON.parse(await readFileFromDisk(data_json_path))
}
