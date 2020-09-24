import moment from 'moment'
import { GetFamille } from '../../appelOffre'
import { EventStore } from '../../eventStore'
import {
  ProjectDCRDueDateSet,
  ProjectGFDueDateSet,
  ProjectNotified,
} from '../events'
import { ProjectCertificateGenerated } from '../events/ProjectCertificateGenerated'
import { ProjectCertificateGenerationFailed } from '../events/ProjectCertificateGenerationFailed'
import { GenerateCertificate } from '../generateCertificate'

export const handleProjectNotified = (
  eventStore: EventStore,
  deps: {
    generateCertificate: GenerateCertificate
    getFamille: GetFamille
  }
) => {
  eventStore.subscribe(ProjectNotified.type, async (event: ProjectNotified) => {
    console.log('handleProjectNotified', event)
    const { payload, requestId } = event
    const {
      projectId,
      periodeId,
      appelOffreId,
      familleId,
      candidateEmail,
      notifiedOn,
    } = payload

    // Set the DCR Due Date
    await eventStore.publish(
      new ProjectDCRDueDateSet({
        payload: {
          projectId,
          dcrDueOn: moment(notifiedOn).add(2, 'months').toDate().getTime(),
        },
        requestId,
      })
    )

    // Set the GF Due Date if required by project family
    const familleResult = await deps.getFamille(appelOffreId, familleId)
    if (
      familleResult &&
      familleResult.isOk() &&
      familleResult.value.garantieFinanciereEnMois > 0
    ) {
      await eventStore.publish(
        new ProjectGFDueDateSet({
          payload: {
            projectId,
            garantiesFinancieresDueOn: moment(notifiedOn)
              .add(familleResult.value.garantieFinanciereEnMois, 'months')
              .toDate()
              .getTime(),
          },
          requestId,
        })
      )
    }

    let retries = 3
    let certificateFileId = ''
    while (retries-- > 0) {
      const result = await deps.generateCertificate(projectId)
      if (result.isErr()) {
        console.log(
          'handleProjectNotified generateCertificated failed' +
            (retries > 0 ? ', retrying' : ' for the 3rd time, aborting.'),
          result.error
        )

        if (retries === 0) {
          eventStore.publish(
            new ProjectCertificateGenerationFailed({
              payload: {
                projectId,
                candidateEmail,
                periodeId,
                appelOffreId,
                error: result.error.message,
              },
              requestId,
            })
          )
        }
      } else {
        certificateFileId = result.value
        break
      }
    }

    if (retries >= 0 && certificateFileId) {
      eventStore.publish(
        new ProjectCertificateGenerated({
          payload: {
            projectId,
            candidateEmail,
            periodeId,
            appelOffreId,
            certificateFileId,
          },
          requestId,
        })
      )
    }
  })
}
