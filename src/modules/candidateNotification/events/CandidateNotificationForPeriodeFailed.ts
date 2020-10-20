import { Project, Periode, AppelOffre } from '../../../entities'
import { DomainEvent, BaseDomainEvent } from '../../../core/domain/DomainEvent'

export interface CandidateNotificationForPeriodeFailedPayload {
  candidateEmail: Project['email']
  periodeId: Periode['id']
  appelOffreId: AppelOffre['id']
  error: string
}
export class CandidateNotificationForPeriodeFailed
  extends BaseDomainEvent<CandidateNotificationForPeriodeFailedPayload>
  implements DomainEvent {
  public static type: 'CandidateNotificationForPeriodeFailed' =
    'CandidateNotificationForPeriodeFailed'
  public type = CandidateNotificationForPeriodeFailed.type
  currentVersion = 1
}
