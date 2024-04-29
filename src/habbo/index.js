#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const { initConfig } = require('./functions')

async function init () {
  await initConfig(argv)
}

async function main () {
  try {
    await init()

    const command = argv.c || argv.command
    const isUnity = argv.u || argv.unity

    await require(`./command/${command}`)()
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error('command not found')
    } else {
      console.error(err)
    }
  }
}

main()