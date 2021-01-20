import { err, errAsync, logger, ok, ResultAsync } from '../../../core/utils'
import {
  GetModificationRequestInfoForStatusNotification,
  ModificationRequestInfoForStatusNotificationDTO,
} from '../../../modules/modificationRequest'
import { EntityNotFoundError, InfraNotAvailableError } from '../../../modules/shared'

export const makeGetModificationRequestUpdateInfo = (
  models
): GetModificationRequestInfoForStatusNotification => (modificationRequestId: string) => {
  const { ModificationRequest, Project, User } = models
  if (!ModificationRequest || !Project || !User) return errAsync(new InfraNotAvailableError())

  return ResultAsync.fromPromise(
    ModificationRequest.findByPk(modificationRequestId, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['nomProjet'],
        },
        {
          model: User,
          as: 'requestedBy',
          attributes: ['fullName', 'email', 'id'],
        },
      ],
    }),
    (e: Error) => {
      logger.error(e)
      return new InfraNotAvailableError()
    }
  ).andThen((modificationRequestRaw: any) => {
    if (!modificationRequestRaw) return err(new EntityNotFoundError())

    const {
      type,
      requestedBy: { email, fullName, id },
      project: { nomProjet },
    } = modificationRequestRaw.get()

    return ok({
      type,
      nomProjet,
      porteursProjet: [{ id, email, fullName }],
    } as ModificationRequestInfoForStatusNotificationDTO)
  })
}
