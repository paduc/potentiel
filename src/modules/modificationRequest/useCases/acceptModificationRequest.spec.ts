import { ModificationRequest } from '../ModificationRequest'
import {
  fakeRepo,
  makeFakeModificationRequest,
  makeFakeProject,
} from '../../../__tests__/fixtures/aggregates'
import { makeAcceptModificationRequest } from './acceptModificationRequest'
import { logger, okAsync } from '../../../core/utils'
import { FileObject } from '../../file'
import { Repository, UniqueEntityID } from '../../../core/domain'
import { Readable } from 'stream'
import makeFakeUser from '../../../__tests__/fixtures/user'
import { makeUser } from '../../../entities'
import { UnwrapForTest } from '../../../types'
import { Project } from '../../project/Project'
import { AggregateHasBeenUpdatedSinceError, UnauthorizedError } from '../../shared'

describe('acceptModificationRequest use-case', () => {
  const fakeModificationRequest = {
    ...makeFakeModificationRequest(),
  }

  const fakeProject = {
    ...makeFakeProject(),
    id: fakeModificationRequest.projectId,
  }

  const modificationRequestRepo = fakeRepo(fakeModificationRequest as ModificationRequest)
  const projectRepo = fakeRepo(fakeProject as Project)
  const fileRepo = {
    save: jest.fn((file: FileObject) => okAsync(null)),
    load: jest.fn(),
  }
  const fakeFileContents = Readable.from('test-content')
  const fakeUser = UnwrapForTest(makeUser(makeFakeUser({ role: 'admin' })))

  const acceptModificationRequest = makeAcceptModificationRequest({
    modificationRequestRepo,
    projectRepo,
    fileRepo: fileRepo as Repository<FileObject>,
  })

  describe('when user is admin', () => {
    const fakeUser = UnwrapForTest(makeUser(makeFakeUser({ role: 'admin' })))

    describe('when a response file is attached', () => {
      beforeAll(async () => {
        const res = await acceptModificationRequest({
          modificationRequestId: fakeModificationRequest.id,
          versionDate: fakeModificationRequest.lastUpdatedOn,
          acceptanceParams: { newNotificationDate: new Date(1234) },
          responseFile: fakeFileContents,
          submittedBy: fakeUser,
        })

        if (res.isErr()) logger.error(res.error)
        expect(res.isOk()).toEqual(true)
      })

      it('should call accept on modificationRequest', () => {
        expect(fakeModificationRequest.accept).toHaveBeenCalledTimes(1)
      })

      it('should call grantClasse on project', () => {
        expect(fakeProject.grantClasse).toHaveBeenCalledTimes(1)
        expect(fakeProject.grantClasse.mock.calls[0][0]).toEqual(fakeUser)
      })

      it('should call updateCertificate on project', () => {
        expect(fakeProject.updateCertificate).toHaveBeenCalledTimes(1)
        expect(fakeProject.updateCertificate.mock.calls[0][0]).toEqual(fakeUser)
        expect(fakeProject.updateCertificate.mock.calls[0][1]).toHaveLength(
          new UniqueEntityID().toString().length
        )
      })

      it('should call setNotificationDate on project with the newNotificationDate', () => {
        expect(fakeProject.setNotificationDate).toHaveBeenCalledTimes(1)
        expect(fakeProject.setNotificationDate.mock.calls[0][0]).toEqual(fakeUser)
        expect(fakeProject.setNotificationDate.mock.calls[0][1]).toEqual(1234)
      })

      it('should save the file', () => {
        expect(fileRepo.save).toHaveBeenCalled()
        expect(fileRepo.save.mock.calls[0][0].contents).toEqual(fakeFileContents)
      })

      it('should save the project', () => {
        expect(projectRepo.save).toHaveBeenCalled()
        expect(projectRepo.save.mock.calls[0][0]).toEqual(fakeProject)
      })

      it('should save the modificationRequest', () => {
        expect(modificationRequestRepo.save).toHaveBeenCalled()
        expect(modificationRequestRepo.save.mock.calls[0][0]).toEqual(fakeModificationRequest)
      })
    })
  })

  describe('when user is not admin', () => {
    const fakeUser = UnwrapForTest(makeUser(makeFakeUser({ role: 'porteur-projet' })))

    it('should return UnauthorizedError', async () => {
      const res = await acceptModificationRequest({
        modificationRequestId: fakeModificationRequest.id,
        versionDate: fakeModificationRequest.lastUpdatedOn,
        acceptanceParams: { newNotificationDate: new Date(1) },
        responseFile: fakeFileContents,
        submittedBy: fakeUser,
      })

      expect(res.isErr()).toEqual(true)
      if (res.isOk()) return

      expect(res.error).toBeInstanceOf(UnauthorizedError)
    })
  })

  describe('when versionDate is different than current versionDate', () => {
    it('should return AggregateHasBeenUpdatedSinceError', async () => {
      const res = await acceptModificationRequest({
        modificationRequestId: fakeModificationRequest.id,
        versionDate: new Date(1),
        acceptanceParams: { newNotificationDate: new Date(1) },
        responseFile: fakeFileContents,
        submittedBy: fakeUser,
      })

      expect(res.isErr()).toEqual(true)
      if (res.isOk()) return
      expect(res.error).toBeInstanceOf(AggregateHasBeenUpdatedSinceError)
    })
  })
})
