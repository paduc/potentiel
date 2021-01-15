import { err, errAsync, ok, ResultAsync } from '../../../core/utils'
import {
  GetModificationRequestListForUser,
  ModificationRequestInfoForStatusNotificationDTO,
} from '../../../modules/modificationRequest'
import { EntityNotFoundError, InfraNotAvailableError } from '../../../modules/shared'

export const makeGetModificationRequestListForUser = (
  models
): GetModificationRequestListForUser => (user) => {
  const { ModificationRequest, Project, User } = models
  if (!ModificationRequest || !Project || !User) return errAsync(new InfraNotAvailableError())

  return ResultAsync.fromPromise(
    ModificationRequest.findAll({
      include: [
        {
          model: Project,
          as: 'project',
          attributes: [
            'appelOffreId',
            'periodeId',
            'familleId',
            'nomProjet',
            'communeProjet',
            'departementProjet',
            'regionProjet',
          ],
          required: true,
        },
        {
          model: User,
          as: 'requestedBy',
          attributes: ['fullName', 'email'],
        },
      ],
    }),
    (e) => {
      console.error(e)
      return new InfraNotAvailableError()
    }
  ).andThen((modificationRequestListRaw: any) => {
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
