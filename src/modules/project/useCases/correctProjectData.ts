import { Repository, TransactionalRepository, UniqueEntityID } from '../../../core/domain'
import { err, errAsync, logger, ok, okAsync, Result, ResultAsync } from '../../../core/utils'
import { User } from '../../../entities'
import { FileContents, FileObject, IllegalFileDataError, makeFileObject } from '../../file'
import {
  EntityNotFoundError,
  InfraNotAvailableError,
  OtherError,
  UnauthorizedError,
} from '../../shared'
import { IllegalProjectDataError, ProjectCannotBeUpdatedIfUnnotifiedError } from '../errors'
import { ProjectHasBeenUpdatedSinceError } from '../errors/ProjectHasBeenUpdatedSinceError'
import { Project } from '../Project'
import { GenerateCertificate } from './generateCertificate'

interface CorrectProjectDataDeps {
  projectRepo: TransactionalRepository<Project>
  fileRepo: Repository<FileObject>
  generateCertificate: GenerateCertificate
}

interface CorrectProjectDataArgs {
  projectId: string
  certificateFile?: {
    contents: FileContents
    filename: string
  }
  projectVersionDate: Date
  newNotifiedOn: number
  user: User
  shouldGrantClasse: boolean
  correctedData: Partial<{
    numeroCRE: string
    appelOffreId: string
    periodeId: string
    familleId: string
    nomProjet: string
    territoireProjet: string
    puissance: number
    prixReference: number
    evaluationCarbone: number
    note: number
    nomCandidat: string
    nomRepresentantLegal: string
    email: string
    adresseProjet: string
    codePostalProjet: string
    communeProjet: string
    engagementFournitureDePuissanceAlaPointe: boolean
    isFinancementParticipatif: boolean
    isInvestissementParticipatif: boolean
    motifsElimination: string
  }>
}

type CorrectProjectDataError =
  | InfraNotAvailableError
  | EntityNotFoundError
  | ProjectHasBeenUpdatedSinceError
  | UnauthorizedError
  | ProjectCannotBeUpdatedIfUnnotifiedError
  | IllegalProjectDataError
  | IllegalFileDataError
  | OtherError

export type CorrectProjectData = (
  args: CorrectProjectDataArgs
) => ResultAsync<null, CorrectProjectDataError>

export const makeCorrectProjectData = (deps: CorrectProjectDataDeps): CorrectProjectData => ({
  projectId,
  certificateFile,
  projectVersionDate,
  newNotifiedOn,
  user,
  correctedData,
  shouldGrantClasse,
}) => {
  if (!user || !['admin', 'dgec'].includes(user.role)) {
    return errAsync(new UnauthorizedError())
  }

  return _uploadFileIfExists().andThen((certificateFileId) => {
    // open a transaction on the project to update it
    // the transaction will return a boolean for shouldCertificateBeGenerated
    const projectTransaction = deps.projectRepo.transaction(
      new UniqueEntityID(projectId),
      (
        project: Project
      ): Result<
        boolean,
        | ProjectHasBeenUpdatedSinceError
        | ProjectCannotBeUpdatedIfUnnotifiedError
        | IllegalProjectDataError
      > => {
        if (project.lastUpdatedOn > projectVersionDate) {
          return err(new ProjectHasBeenUpdatedSinceError())
        }

        return _addCertificateToProjectIfExists(certificateFileId, project)
          .andThen(() => _grantClasseIfNecessary(project))
          .andThen(() => project.correctData(user, correctedData))
          .andThen(() => project.setNotificationDate(user, newNotifiedOn))
          .map((): boolean => project.shouldCertificateBeGenerated)
      }
    )

    // If shouldCertificateBeGenerated, generate a new certificate
    return projectTransaction.andThen((shouldCertificateBeGenerated) => {
      return shouldCertificateBeGenerated
        ? deps.generateCertificate(projectId).map(() => null)
        : okAsync<null, CorrectProjectDataError>(null)
    })
  })

  function _grantClasseIfNecessary(project: Project): Result<null, never> {
    return shouldGrantClasse ? project.grantClasse(user) : ok(null)
  }
  function _addCertificateToProjectIfExists(
    certificateFileId: string | null,
    project: Project
  ): Result<null, ProjectCannotBeUpdatedIfUnnotifiedError> {
    return certificateFileId ? project.updateCertificate(user, certificateFileId) : ok(null)
  }

  function _uploadFileIfExists(): ResultAsync<
    string | null,
    IllegalFileDataError | InfraNotAvailableError
  > {
    if (!certificateFile) return okAsync(null)

    const { filename, contents } = certificateFile

    return makeFileObject({
      designation: 'garantie-financiere',
      forProject: new UniqueEntityID(projectId),
      createdBy: new UniqueEntityID(user.id),
      filename,
      contents,
    }).asyncAndThen((file) =>
      deps.fileRepo
        .save(file)
        .map(() => file.id.toString())
        .mapErr((e: Error) => {
          logger.error(e)
          return new InfraNotAvailableError()
        })
    )
  }
}
