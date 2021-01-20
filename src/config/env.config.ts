import { logger } from '../core/utils/logger'
import dotenv from 'dotenv'
dotenv.config()

if (!['test', 'development', 'staging', 'production'].includes(process.env.NODE_ENV || '')) {
  logger.error(new Error('ERROR: NODE_ENV not recognized'))
  process.exit(1)
}

export const isTestEnv = process.env.NODE_ENV === 'test'
export const isDevEnv = process.env.NODE_ENV === 'development'
export const isStagingEnv = process.env.NODE_ENV === 'staging'
export const isProdEnv = process.env.NODE_ENV === 'production'

logger.info(
  'Environment is ' +
    (isTestEnv
      ? 'Test'
      : isDevEnv
      ? 'Dev'
      : isStagingEnv
      ? 'Staging'
      : isProdEnv
      ? 'Production'
      : 'Not recognized')
)
