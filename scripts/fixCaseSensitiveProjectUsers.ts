import dotenv from 'dotenv'
import { initDatabase, userRepo, sequelize } from '../src/dataAccess'
dotenv.config()

initDatabase()
  .then(async () => {
    // Get all projects with a garantiesFinancieresFile and no garantiesFinancieresFileId

    const ProjectModel = sequelize.model('project')
    const allProjects = await ProjectModel.findAll({
      // logging: console.log,
    })

    const projectsToUpdate = allProjects.filter(
      (project) => project.email !== project.email.toLowerCase()
    )

    console.log('Found', projectsToUpdate.length, 'projects to update')

    for (const project of projectsToUpdate.map((item) => item.get())) {
      await userRepo.addProjectToUserWithEmail(project.id, project.email.toLowerCase())
    }
  })
  .then(() => {
    console.log('\nProjets sensibles à la casse mis à jour')

    process.exit(0)
  })
  .catch((err) => {
    console.log('Caught error', err)
    process.exit(1)
  })
