import dotenv from 'dotenv'
import { credentialsRepo, initDatabase, userRepo } from '../src/dataAccess'
import { makeCredentials, makeUser } from '../src/entities'
import { logger } from '../src/core/utils/logger'
dotenv.config()

const [_, __, email, password, name] = process.argv

if (!email || !password) {
  logger.error(
    new Error('email and password are mandatory (ex: node createUser.js test@test.com test)')
  )
  process.exit(1)
}

logger.info(`Creating user with email ${email} and password ${password} and named ${name}`)

initDatabase()
  .then(() => {
    const userResult = makeUser({
      fullName: name,
      email,
      role: 'admin',
    })

    if (userResult.is_err()) {
      logger.error(userResult.unwrap_err())
      return process.exit(1)
    }
    const user = userResult.unwrap()

    const credentialsResult = makeCredentials({
      userId: userResult.unwrap().id,
      email,
      password,
    })
    if (credentialsResult.is_err()) {
      logger.error(credentialsResult.unwrap_err())
      return process.exit(1)
    }

    const credentials = credentialsResult.unwrap()

    return Promise.all([userRepo.insert(user), credentialsRepo.insert(credentials)])
  })
  .then(([userInsertion, credentialsInsertion]) => {
    if (userInsertion.is_err()) {
      logger.error(userInsertion.unwrap_err())
      return process.exit(1)
    }

    if (credentialsInsertion.is_err()) {
      logger.error(credentialsInsertion.unwrap_err())
      return process.exit(1)
    }

    logger.info('User was successfuly inserted into db')
    process.exit(0)
  })
  .catch((err) => {
    logger.error(err)
    process.exit(1)
  })
