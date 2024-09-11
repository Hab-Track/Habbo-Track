#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const { initConfig } = require('./functions')

process.exit = (o => code => {
  console.warn(`process.exit(${code}) was called, but intercepted`);
  console.trace()
  // Handle the exit code or decide to continue
  // Optionally call the original process.exit if needed
  // o(code);
})(process.exit);

async function main() {
  if (!await initConfig(argv)) {
    return
  }

  const command = argv.c || argv.command
  const isOrigins = argv.u || argv.origins

  try {
    if (isOrigins) {
      await require(`./command/origins/${command}`)()
    } else {
      await require(`./command/${command}`)()
    }
  } catch (err) {
    console.error("huehuebr")
    console.error(err)
  }
  process.exitCode = 0
}

main()
