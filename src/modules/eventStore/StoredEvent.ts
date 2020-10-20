import {
  CandidateNotificationForPeriodeFailed,
  CandidateNotifiedForPeriode,
} from '../candidateNotification/events'
import {
  LegacyProjectEventSourced,
  LegacyProjectSourced,
  PeriodeNotified,
  ProjectCertificateGenerated,
  ProjectCertificateGenerationFailed,
  ProjectCertificateUpdated,
  ProjectCertificateUpdateFailed,
  ProjectDCRDueDateSet,
  ProjectDCRRemoved,
  ProjectDCRSubmitted,
  ProjectGFDueDateSet,
  ProjectGFReminded,
  ProjectGFRemoved,
  ProjectGFSubmitted,
  ProjectImported,
  ProjectNotified,
  ProjectDataCorrected,
  ProjectNotificationDateSet,
  ProjectReimported,
} from '../project/events'

export type StoredEvent =
  | ProjectNotified
  | ProjectCertificateGenerated
  | ProjectCertificateGenerationFailed
  | ProjectCertificateUpdated
  | ProjectCertificateUpdateFailed
  | PeriodeNotified
  | CandidateNotificationForPeriodeFailed
  | CandidateNotifiedForPeriode
  | ProjectDCRDueDateSet
  | ProjectGFDueDateSet
  | LegacyProjectEventSourced
  | LegacyProjectSourced
  | ProjectImported
  | ProjectReimported
  | ProjectDCRRemoved
  | ProjectDCRSubmitted
  | ProjectGFSubmitted
  | ProjectGFRemoved
  | ProjectGFReminded
  | ProjectDataCorrected
  | ProjectNotificationDateSet
