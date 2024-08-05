#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const { initConfig } = require('./functions')

async function main () {
    await initConfig(argv)

    const command = argv.c || argv.command
    const isOrigins = argv.u || argv.origins

    try {
      if (isOrigins) {
        await require(`./command/origins/${command}`)()
      } else {
        await require(`./command/${command}`)()
      }
  } catch(err) {
      console.error(err)
  }
}

main()