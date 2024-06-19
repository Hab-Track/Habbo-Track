#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const { initConfig } = require('./functions')

async function main () {
  try {
    await initConfig(argv)

    const command = argv.c || argv.command
    const isOrigins = argv.u || argv.origins

    if (isOrigins) {
      await require(`./command/origins/${command}`)()
    } else {
      await require(`./command/${command}`)()
    }
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error('command not found')
    } else {
      console.error(err)
    }
  }
}

main()