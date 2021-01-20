import { setWorldConstructor, setDefaultTimeout } from 'cucumber'
import { Page } from 'puppeteer'

import { User, Project } from '../../src/entities'
import routes from '../../src/routes'
import { testId } from '../../src/helpers/testId'

import makeRoute from './makeRoute'
import { logger } from '../../src/core/utils/logger'

setDefaultTimeout(30 * 1000)

export class World {
  userId: User['id']
  projects: Array<Project>

  public page: Page
  constructor() {
    // logger.info('World constructor called')
  }

  async newPage() {
    this.page = await global['__BROWSER__'].newPage()
  }

  async getPage() {
    return await this.page
  }

  async navigateTo(route, options = {}) {
    await this.page.goto(route, options)
  }

  async logout() {
    // logger.info('Calling logout')
    await this.navigateTo(makeRoute(routes.LOGOUT_ACTION))
  }

  async loginAs({ email, password }) {
    // logger.info('Going to login page')
    await this.navigateTo(makeRoute(routes.LOGIN))

    await this.page.type(testId('login-email'), email)
    await this.page.type(testId('login-password'), password)

    await this.page.click(testId('login-submitButton'))
    // logger.info('Login done')
  }
}

setWorldConstructor(World)
