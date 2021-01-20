import { makeProjectAdmissionKey } from '../../entities'
import { Success, SystemError } from '../../helpers/responses'
import { HttpRequest } from '../../types'
import ROUTES from '../../routes'
import { projectAdmissionKeyRepo } from '../../dataAccess'
import { logger } from '../../core/utils/logger'

const createInvitationForTests = async (request: HttpRequest) => {
  const { email } = request.body

  if (!email) {
    logger.error(new Error('createInvitationForTests missing email'))
    return SystemError('missing email')
  }

  const projectAdmissionKeyResult = makeProjectAdmissionKey({
    email,
    fullName: 'test user',
  })

  if (projectAdmissionKeyResult.is_err()) {
    logger.error(
      new Error(
        `createInvitationForTests: error when calling makeProjectAdmissionKey with' ${email}`
      )
    )
    return SystemError('Impossible de créer le projectAdmissionKey')
  }

  const projectAdmissionKey = projectAdmissionKeyResult.unwrap()

  await projectAdmissionKeyRepo.save(projectAdmissionKey)

  return Success(ROUTES.PROJECT_INVITATION({ projectAdmissionKey: projectAdmissionKey.id }))
}

export { createInvitationForTests }
