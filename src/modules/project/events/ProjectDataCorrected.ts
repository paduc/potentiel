import { Project, Periode, AppelOffre, Famille } from '../../../entities'
import { DomainEvent, BaseDomainEvent } from '../../../core/domain/DomainEvent'

export interface ProjectDataCorrectedPayload {
  projectId: Project['id']
  certificateFileId?: Project['certificateFileId']
  correctedData: Partial<{
    numeroCRE: string
    appelOffreId: string
    periodeId: string
    familleId: string
    nomProjet: string
    territoire: string
    puissance: number
    prixReference: number
    evaluationCarbone: number
    note: number
    nomCandidat: string
    nomRepresentalLegal: string
    email: string
    adresseProjet: string
    codePostalProjet: string
    communeProjet: string
    engagementFournitureDePuissanceAlaPointe: boolean
    isFinancementParticipatif: boolean
    isInvestissementParticipatif: boolean
    isClasse: boolean
    motifsElimination: string
  }>
}
export class ProjectDataCorrected
  extends BaseDomainEvent<ProjectDataCorrectedPayload>
  implements DomainEvent {
  public static type: 'ProjectDataCorrected' = 'ProjectDataCorrected'
  public type = ProjectDataCorrected.type
  currentVersion = 1
}