import {
  handlePeriodeNotified,
  handleProjectDataCorrected,
  handleProjectNotified,
} from '../../modules/project/eventHandlers'
import { handleProjectNotificationDateSet } from '../../modules/project/eventHandlers/handleProjectNotificationDateSet'
import {
  PeriodeNotified,
  ProjectDataCorrected,
  ProjectNotificationDateSet,
  ProjectNotified,
} from '../../modules/project/events'
import { eventStore } from '../eventStore.config'
import { getUnnotifiedProjectsForPeriode } from '../queries.config'
import { appelOffreRepo, projectRepo } from '../repos.config'
import { generateCertificate } from '../useCases.config'

eventStore.subscribe(
  ProjectNotificationDateSet.type,
  handleProjectNotificationDateSet({
    eventBus: eventStore,
    findProjectById: projectRepo.findById,
    getFamille: appelOffreRepo.getFamille,
  })
)

eventStore.subscribe(
  PeriodeNotified.type,
  handlePeriodeNotified({
    eventStore,
    getUnnotifiedProjectsForPeriode,
  })
)

eventStore.subscribe(
  ProjectNotified.type,
  handleProjectNotified({
    eventBus: eventStore,
    generateCertificate,
  })
)

eventStore.subscribe(
  ProjectDataCorrected.type,
  handleProjectDataCorrected({
    eventBus: eventStore,
    generateCertificate,
  })
)

console.log('Project Event Handlers Initialized')