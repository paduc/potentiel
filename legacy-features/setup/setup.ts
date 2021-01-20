import { Given, When, Then, BeforeAll, AfterAll } from 'cucumber'
import puppeteer from 'puppeteer'

import { PORT } from '../setup/config'
import { makeServer } from '../../src/server'

import { ADMIN, PORTEUR_PROJET } from '../../src/__tests__/fixtures/testCredentials'

import fs from 'fs'
import util from 'util'
import { logger } from '../../src/core/utils/logger'

const deleteFile = util.promisify(fs.unlink)

const HEADLESS = process.env.HEADLESS !== 'false'

const puppeteerOpts = HEADLESS
  ? {}
  : {
      headless: true,
      slowMo: 100,
      // timeout: 0,
      args: ['--start-maximized', '--window-size=1920,1040'],
    }

BeforeAll(async function () {
  logger.info('BeforeAll called')

  logger.info('Launching web server')
  global['__SERVER__'] = await makeServer(PORT)
  logger.info(`Server is running on ${PORT}...`)

  logger.info('Launching puppeteer browser')
  global['__BROWSER__'] = await puppeteer.launch(puppeteerOpts)
  logger.info('launched browser !')

  logger.info('BeforeAll done')
})

AfterAll(async function () {
  logger.info('AfterAll called')
  global['__SERVER__'].close()

  global['__BROWSER__'].close()

  // Reset the database
  // await deleteFile('.db/test.sqlite')

  logger.info('AfterAll done')
})
