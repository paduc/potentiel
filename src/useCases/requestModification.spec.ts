import makeRequestModification, { ACCESS_DENIED_ERROR } from './requestModification'

import makeFakeUser from '../__tests__/fixtures/user'
import { Readable } from 'stream'
import { modificationRequestRepo } from '../dataAccess/inMemory'
import { FileObject } from '../modules/file'
import { okAsync } from '../core/utils'
import { Repository } from '../core/domain'
import { StoredEvent } from '../modules/eventStore'
import { InfraNotAvailableError } from '../modules/shared'

const fakeFileContents = {
  filename: 'fakeFile.pdf',
  contents: Readable.from('test-content'),
}

describe('requestModification use-case', () => {
  describe('given user has no rights on this project', () => {
    const shouldUserAccessProject = jest.fn(async () => false)

    const fileRepo = {
      save: jest.fn(),
      load: jest.fn(),
    }

    const eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    }

    const requestModification = makeRequestModification({
      fileRepo,
      eventBus,
      shouldUserAccessProject,
    })

    it('should return ACCESS_DENIED_ERROR', async () => {
      const user = makeFakeUser({ role: 'porteur-projet' })
      const requestResult = await requestModification({
        type: 'actionnaire',
        actionnaire: 'nouvel actionnaire',
        file: fakeFileContents,
        user,
        projectId: 'project1',
      })

      expect(shouldUserAccessProject).toHaveBeenCalledWith({
        user,
        projectId: 'project1',
      })

      expect(fileRepo.save).not.toHaveBeenCalled()
      expect(requestResult.is_err()).toEqual(true)
      expect(requestResult.unwrap_err().message).toEqual(ACCESS_DENIED_ERROR)
    })
  })

  describe('given user is not a porteur-projet', () => {
    const shouldUserAccessProject = jest.fn()

    const fileRepo = {
      save: jest.fn(),
      load: jest.fn(),
    }

    const eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    }

    const requestModification = makeRequestModification({
      fileRepo,
      eventBus,
      shouldUserAccessProject,
    })

    it('should return ACCESS_DENIED_ERROR', async () => {
      const user = makeFakeUser({ role: 'admin' })
      const requestResult = await requestModification({
        type: 'actionnaire',
        actionnaire: 'nouvel actionnaire',
        file: fakeFileContents,
        user,
        projectId: 'project1',
      })

      expect(shouldUserAccessProject).not.toHaveBeenCalled()
      expect(fileRepo.save).not.toHaveBeenCalled()
      expect(requestResult.is_err()).toEqual(true)
      expect(requestResult.unwrap_err().message).toEqual(ACCESS_DENIED_ERROR)
    })
  })

  describe('given user is the projects porteur-project', () => {
    const shouldUserAccessProject = jest.fn(async () => true)

    const fileRepo = {
      save: jest.fn((file: FileObject) => okAsync(null)),
      load: jest.fn(),
    }

    const eventBus = {
      publish: jest.fn((event: StoredEvent) => okAsync<null, InfraNotAvailableError>(null)),
      subscribe: jest.fn(),
    }

    const requestModification = makeRequestModification({
      fileRepo: fileRepo as Repository<FileObject>,
      eventBus,
      shouldUserAccessProject,
    })

    const user = makeFakeUser({ id: '1234', role: 'porteur-projet' })

    beforeAll(async () => {
      const requestResult = await requestModification({
        type: 'actionnaire' as 'actionnaire',
        actionnaire: 'nouvel actionnaire',
        file: fakeFileContents,
        user,
        projectId: 'project1',
      })

      expect(requestResult.is_ok()).toEqual(true)
    })

    it('should save the file attachment', () => {
      // Make sure the file has been saved
      expect(fileRepo.save).toHaveBeenCalled()
      expect(fileRepo.save.mock.calls[0][0].contents).toEqual(fakeFileContents.contents)
      const fakeFile = fileRepo.save.mock.calls[0][0]
      expect(fakeFile).toBeDefined()
    })

    it('should emit ModificationRequested', () => {
      const fakeFile = fileRepo.save.mock.calls[0][0]
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
      expect(eventBus.publish.mock.calls[0][0].payload).toEqual(
        expect.objectContaining({
          type: 'actionnaire',
          actionnaire: 'nouvel actionnaire',
          fileId: fakeFile.id.toString(),
          requestedBy: user.id,
          projectId: 'project1',
        })
      )
    })
  })
})
