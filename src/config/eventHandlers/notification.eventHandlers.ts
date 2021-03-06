import {
  handleProjectCertificateUpdatedOrRegenerated,
  handleModificationRequestStatusChanged,
} from '../../modules/notification'
import {
  ProjectCertificateRegenerated,
  ProjectCertificateUpdated,
} from '../../modules/project/events'
import { projectRepo, oldProjectRepo } from '../repos.config'
import { getModificationRequestInfoForStatusNotification } from '../queries.config'
import { eventStore } from '../eventStore.config'
import { sendNotification } from '../emails.config'
import {
  ModificationRequestAccepted,
  ModificationRequestInstructionStarted,
} from '../../modules/modificationRequest'

const projectCertificateChangeHandler = handleProjectCertificateUpdatedOrRegenerated({
  sendNotification,
  projectRepo,
  getUsersForProject: oldProjectRepo.getUsers,
})

eventStore.subscribe(ProjectCertificateUpdated.type, projectCertificateChangeHandler)
eventStore.subscribe(ProjectCertificateRegenerated.type, projectCertificateChangeHandler)

const modificationRequestStatusChangeHandler = handleModificationRequestStatusChanged({
  sendNotification,
  getModificationRequestInfoForStatusNotification,
})
eventStore.subscribe(
  ModificationRequestInstructionStarted.type,
  modificationRequestStatusChangeHandler
)
eventStore.subscribe(ModificationRequestAccepted.type, modificationRequestStatusChangeHandler)

console.log('Notification Event Handlers Initialized')
export const notificationHandlersOk = true
