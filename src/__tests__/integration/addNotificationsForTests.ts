import { Success, SystemError } from '../../helpers/responses'
import { HttpRequest } from '../../types'
import { logger } from '../../core/utils/logger'

const addNotificationsForTests = async (request: HttpRequest) => {
  const { notifications } = request.body

  if (!notifications) {
    logger.error(new Error('tests/addNotificationsForTests missing notifications'))
    return SystemError('tests/addNotificationsForTests missing notifications')
  }

  return Success('success')
}

export { addNotificationsForTests }
