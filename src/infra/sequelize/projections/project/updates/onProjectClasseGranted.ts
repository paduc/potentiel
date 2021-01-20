import { logger } from '../../../../../core/utils/logger'
import { ProjectClasseGranted } from '../../../../../modules/project/events'

export const onProjectClasseGranted = (models) => async (event: ProjectClasseGranted) => {
  const ProjectModel = models.Project
  const projectInstance = await ProjectModel.findByPk(event.payload.projectId)

  if (!projectInstance) {
    logger.error(
      new Error(
        `Error: onProjectClasseGranted projection failed to retrieve project from db ${event}`
      )
    )
    return
  }

  projectInstance.classe = 'Classé'

  try {
    await projectInstance.save()
  } catch (e) {
    logger.error(e)
    logger.info('Error: onProjectClasseGranted projection failed to update project', event)
  }
}
