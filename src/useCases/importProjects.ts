import { Project, makeProject } from '../entities'
import { ProjectRepo, AppelOffreRepo } from '../dataAccess'
import _ from 'lodash'
import { Result, ResultAsync, Err, Ok, ErrorResult } from '../types'
import toNumber from '../helpers/toNumber'
import moment from 'moment'

interface MakeUseCaseProps {
  projectRepo: ProjectRepo
  appelOffreRepo: AppelOffreRepo
}

interface CallUseCaseProps {
  lines: Array<Record<string, any>> // the csv lines (split by separator)
}

export const ERREUR_AUCUNE_LIGNE = 'Le fichier semble vide (aucune ligne)'
export const ERREUR_FORMAT_LIGNE = 'Le fichier comporte des lignes erronées'
export const ERREUR_INSERTION = "Impossible d'insérer les projets en base"

const makeErrorForLine = (
  error,
  lineIndex,
  currentResults: Result<Array<Project>, Array<Error>>
) => {
  let errors: Array<Error> = []
  if (currentResults.is_err()) {
    // It already had errors, add this one
    errors = currentResults.unwrap_err()
  }
  // Add the error from this line prefixed with the line number
  error.message =
    'Ligne ' +
    lineIndex +
    ': ' +
    error.message.replace(
      'Failed constraint check in field',
      'Valeur interdite dans le champ'
    )
  errors.push(error)

  return Err(errors)
}

export default function makeImportProjects({
  projectRepo,
  appelOffreRepo,
}: MakeUseCaseProps) {
  return async function importProjects({
    lines,
  }: CallUseCaseProps): ResultAsync<null> {
    // Check if there is at least one line to insert
    if (!lines || !lines.length) {
      console.log('importProjects use-case: missing lines', lines)
      return ErrorResult(ERREUR_AUCUNE_LIGNE)
    }

    const appelsOffre = await appelOffreRepo.findAll()

    // Check individual lines (use makeProject on each)
    const projects = lines.reduce(
      (currentResults: Result<Array<Project>, Array<Error>>, line, index) => {
        // Find the corresponding appelOffre
        const appelOffreId = line["Appel d'offres"]
        const appelOffre = appelsOffre.find(
          (appelOffre) => appelOffre.id === appelOffreId
        )

        if (!appelOffreId || !appelOffre) {
          console.log('Appel offre introuvable', appelOffreId)
          return makeErrorForLine(
            new Error("Appel d'offre introuvable " + appelOffreId),
            index + 2,
            currentResults
          )
        }

        // Check the periode
        const periodeId = line['Période']
        const periode = appelOffre.periodes.find(
          (periode) => periode.id === periodeId
        )

        if (!periodeId || !periode) {
          console.log(
            'Periode introuvable',
            periodeId,
            appelOffre.periodes.map((item) => item.id)
          )
          return makeErrorForLine(
            new Error('Période introuvable'),
            index + 2,
            currentResults
          )
        }

        // All good, try to make the project
        const projectData = {
          appelOffreId,
          periodeId,
          ...appelOffre.dataFields.reduce((properties, dataField) => {
            const { field, column, type, value } = dataField

            // Parse line depending on column format
            const fieldValue =
              type === 'string'
                ? line[column] && line[column].trim()
                : type === 'number'
                ? toNumber(line[column])
                : type === 'date'
                ? (line[column] &&
                    moment(line[column], 'DD/MM/YYYY').toDate().getTime()) ||
                  undefined
                : type === 'stringEquals'
                ? line[column] === value
                : type === 'orNumberInColumn'
                ? line[column]
                  ? toNumber(line[column])
                  : value && toNumber(line[value])
                : undefined

            return {
              ...properties,
              [field]: fieldValue,
            }
          }, {}),
        }

        const projectResult = makeProject(projectData as Project)

        if (projectResult.is_err()) {
          // This line is an error
          // console.log(
          //   'importProjects use-case: this line has an error',
          //   projectData,
          //   // line,
          //   projectResult.unwrap_err()
          // )

          // Add the error from this line prefixed with the line number
          const projectError = projectResult.unwrap_err()
          // projectError.message =
          //   'Ligne ' + (index + 2) + ': ' + projectError.message

          return makeErrorForLine(projectError, index + 2, currentResults)
        }

        if (currentResults.is_err()) {
          // This line is not an error but previous lines are
          return currentResults
        }

        // No errors so far
        // Add this line's project to the current list
        const projects = currentResults.unwrap()
        projects.push(projectResult.unwrap())
        return Ok(projects)
      },
      Ok([]) as Result<Array<Project>, Array<Error>>
    )

    if (projects.is_err()) {
      // console.log(
      //   'importProjects use-case: some projects have errors',
      //   projects.unwrap_err()
      // )
      const error = new Error()
      error.message = projects
        .unwrap_err()
        .reduce(
          (message, error) => message + ':\n' + error.message,
          ERREUR_FORMAT_LIGNE
        )
      return Err(error)
    }

    const insertions: Array<Result<Project, Error>> = await Promise.all(
      projects.unwrap().map(projectRepo.insert)
    )

    if (insertions.some((project) => project.is_err())) {
      // console.log(
      //   'importProjects use-case: some insertions have errors',
      //   insertions
      //     .filter((item) => item.is_err())
      //     .map((item) => item.unwrap_err())
      // )
      projects.unwrap_err()
      // Some projects failed to be inserted
      // Remove all the others
      await Promise.all(
        insertions
          .filter((project) => project.is_ok())
          .map((project) => project.unwrap().id)
          .map(projectRepo.remove)
      )
      return ErrorResult(ERREUR_INSERTION)
    }

    return Ok(null)
  }
}
