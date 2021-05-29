/**
 * This scripts prepares installed plugins to run with local server
 * by rewriting require('@saltana/core') calls.
 * Docker/CI build process requires to separate this step from plugin install,
 * so that we can use secrets in Dockerfile.prod
 */

require('@saltana/common').load()
const path = require('path')
const shell = require('shelljs')

const { getInstalledPluginsNames } = require('../plugins')
const stelaceServerPath = path.resolve(__dirname, '..')

if (getInstalledPluginsNames().length) {
  console.log("Replacing `require('@saltana/core')` with local server for tests of installed plugins")

  const pluginFiles = shell
    .find(`${stelaceServerPath}/plugins/installed`)
    // no -type f filter in shelljs
    .filter(file => file.match(/\.js$/))

  shell.sed(
    '-i',
    /require\('stelace-server([^']*)'\)/,
    `require('${stelaceServerPath}$1')`,
    pluginFiles
  )
}