import models from '../models'
import { resetDatabase } from '../helpers'
import makeFakeProject from '../../../__tests__/fixtures/project'
import makeFakeFile from '../../../__tests__/fixtures/file'
import makeFakeUser from '../../../__tests__/fixtures/user'
import { makeGetModificationRequestListForUser } from './getModificationRequestListForUser'
import { UniqueEntityID } from '../../../core/domain'
import { makeUser } from '../../../entities'

describe('Sequelize getModificationRequestListForUser', () => {
  const getModificationRequestListForUser = makeGetModificationRequestListForUser(models)

  const projectId = new UniqueEntityID().toString()
  const fileId = new UniqueEntityID().toString()
  const userId = new UniqueEntityID().toString()

  const projectInfo = {
    id: projectId,
    nomProjet: 'nomProjet',
    communeProjet: 'communeProjet',
    departementProjet: 'departementProjet',
    regionProjet: 'regionProjet',
    appelOffreId: 'Fessenheim',
    periodeId: '1',
    familleId: 'familleId',
  }

  describe('when user is admin', () => {
    const fakeUserInfo = makeFakeUser({ id: userId, fullName: 'John Doe', role: 'admin' })
    const fakeUser = makeUser(fakeUserInfo).unwrap_or(null)

    beforeAll(async () => {
      // Create the tables and remove all data
      await resetDatabase()

      const ProjectModel = models.Project
      await ProjectModel.create(makeFakeProject(projectInfo))

      const FileModel = models.File
      await FileModel.create(makeFakeFile({ id: fileId, filename: 'filename' }))

      const UserModel = models.User
      await UserModel.create()

      const modificationRequestId = new UniqueEntityID().toString()

      const ModificationRequestModel = models.ModificationRequest
      await ModificationRequestModel.create({
        id: modificationRequestId,
        projectId,
        userId,
        fileId,
        type: 'recours',
        requestedOn: 123,
        status: 'envoyée',
        justification: 'justification',
      })
    })

    it('should return a paginated list of all modification requests', async () => {
      const res = await getModificationRequestListForUser(fakeUser)

      expect(res.isOk()).toBe(true)
    })
  })
})
