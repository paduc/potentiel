import { okAsync, ResultAsync } from '../../../core/utils'
import { makeProject } from '../../../entities'
import { UnwrapForTest } from '../../../types'
import makeFakeProject from '../../../__tests__/fixtures/project'
import { StoredEvent } from '../../eventStore'
import { InfraNotAvailableError, OtherError } from '../../shared'
import {
  CandidateNotifiedForPeriode,
  ProjectCertificateGenerated,
  ProjectCertificateGenerationFailed,
  ProjectNotified,
} from '../events'
import { handleProjectCertificateGenerated } from './'

describe('handleProjectCertificateGenerated', () => {
  const project = UnwrapForTest(
    makeProject(
      makeFakeProject({
        nomRepresentantLegal: 'representant1',
      })
    )
  )

  const findProjectById = jest.fn(async (args) => project)

  describe('when all projects for this periode and email have a ProjectCertificateGenerated (or failed)', () => {
    const fakePayload = {
      periodeId: 'periode1',
      familleId: 'famille1',
      appelOffreId: 'appelOffre1',
      candidateEmail: 'email1@test.test',
      notifiedOn: 0,
    }

    const publish = jest.fn((event: StoredEvent) =>
      okAsync<null, InfraNotAvailableError>(null)
    )
    const loadHistory = jest.fn((filters) => {
      expect(filters.payload).toEqual(
        expect.objectContaining({
          candidateEmail: fakePayload.candidateEmail,
        })
      )

      if (filters.eventType === CandidateNotifiedForPeriode.type) {
        return okAsync([])
      }

      if (filters.eventType === ProjectNotified.type) {
        return okAsync([
          // Simulate two projects for the same candidateEmail
          new ProjectNotified({
            payload: { ...fakePayload, projectId: 'project1' },
            requestId: 'request1',
          }),
          new ProjectNotified({
            payload: { ...fakePayload, projectId: 'project2' },
            requestId: 'request1',
          }),
        ])
      }

      if (Array.isArray(filters.eventType)) {
        return okAsync([
          // project1 has a successfully generated certificate
          new ProjectCertificateGenerated({
            payload: {
              ...fakePayload,
              projectId: 'project1',
              certificateFileId: 'certificateFile1',
            },
            requestId: 'request1',
          }),
          // project2 has a failed certificate generation
          new ProjectCertificateGenerationFailed({
            payload: {
              ...fakePayload,
              projectId: 'project2',
              error: 'oops',
            },
            requestId: 'request1',
          }),
        ])
      }
    })
    const eventStore = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      transaction: jest.fn((cb) => {
        return ResultAsync.fromPromise<
          null,
          InfraNotAvailableError | OtherError
        >(cb({ publish, loadHistory }), () => new OtherError()).map(() => null)
      }),
    }

    let candidateNotifiedEvent: StoredEvent | undefined = undefined

    it('should trigger CandidateNotifiedForPeriode', async () => {
      publish.mockClear()

      // handle the triggering event
      await handleProjectCertificateGenerated({ eventStore, findProjectById })(
        new ProjectCertificateGenerated({
          payload: {
            ...fakePayload,
            projectId: 'project1',
            certificateFileId: 'certificateFile1',
          },
          requestId: 'request1',
        })
      )

      expect(publish).toHaveBeenCalledTimes(1)
      candidateNotifiedEvent = publish.mock.calls[0][0]
      expect(candidateNotifiedEvent.type).toEqual(
        CandidateNotifiedForPeriode.type
      )

      expect(candidateNotifiedEvent!.payload).toEqual({
        candidateEmail: fakePayload.candidateEmail,
        periodeId: fakePayload.periodeId,
        appelOffreId: fakePayload.appelOffreId,
        candidateName: 'representant1',
      })
      expect(candidateNotifiedEvent!.requestId).toEqual('request1')
    })
  })

  describe('when some projects for this periode and email have no ProjectCertificateGenerated yet', () => {
    const fakePayload = {
      periodeId: 'periode1',
      familleId: 'famille1',
      appelOffreId: 'appelOffre1',
      candidateEmail: 'email1@test.test',
      notifiedOn: 0,
    }

    const publish = jest.fn((event: StoredEvent) =>
      okAsync<null, InfraNotAvailableError>(null)
    )
    const loadHistory = jest.fn((filters) => {
      expect(filters.payload).toEqual(
        expect.objectContaining({
          candidateEmail: fakePayload.candidateEmail,
        })
      )

      if (filters.eventType === CandidateNotifiedForPeriode.type) {
        return okAsync([])
      }

      if (filters.eventType === ProjectNotified.type) {
        return okAsync([
          // Simulate two projects for the same candidateEmail
          new ProjectNotified({
            payload: { ...fakePayload, projectId: 'project1' },
            requestId: 'request1',
          }),
          new ProjectNotified({
            payload: { ...fakePayload, projectId: 'project2' },
            requestId: 'request1',
          }),
        ])
      }

      if (Array.isArray(filters.eventType)) {
        return okAsync([
          // project1 has a successfully generated certificate
          new ProjectCertificateGenerated({
            payload: {
              ...fakePayload,
              projectId: 'project1',
              certificateFileId: 'certificateFile1',
            },
            requestId: 'request1',
          }),
          // project2 has no certificate yet
        ])
      }
    })
    const eventStore = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      transaction: jest.fn((cb) => {
        return ResultAsync.fromPromise<
          null,
          InfraNotAvailableError | OtherError
        >(cb({ publish, loadHistory }), () => new OtherError()).map(() => null)
      }),
    }

    it('should not trigger CandidateNotifiedForPeriode', async () => {
      await handleProjectCertificateGenerated({ eventStore, findProjectById })(
        new ProjectCertificateGenerated({
          payload: {
            ...fakePayload,
            projectId: 'project1',
            certificateFileId: 'certificateFile1',
          },
        })
      )

      expect(publish).not.toHaveBeenCalled()
    })
  })
})
