import { Project, makeProjectIdentifier } from './entities'
import querystring from 'querystring'
import sanitize from 'sanitize-filename'
import { makeCertificateFilename } from './modules/project/utils'

const withParams = <T extends Record<string, any>>(url: string) => (params?: T) => {
  if (!params) return url

  let priorQuery = {}
  if (url.indexOf('?') > -1) {
    priorQuery = querystring.parse(url.substring(url.indexOf('?') + 1))
  }

  const newQueryString = querystring.stringify({ ...priorQuery, ...params })

  return (
    (url.indexOf('?') === -1 ? url : url.substring(0, url.indexOf('?'))) +
    (newQueryString.length ? '?' + newQueryString.toString() : '')
  )
}

const withProjectId = (url: string) => (projectId: Project['id']) => withParams(url)({ projectId })

export { withParams }

class routes {
  static HOME = '/'
  static LOGIN = '/login.html'
  static STATS = '/stats.html'
  static LOGIN_ACTION = '/login'
  static LOGOUT_ACTION = '/logout'
  static FORGOTTEN_PASSWORD = '/mot-de-passe-oublie.html'
  static FORGOTTEN_PASSWORD_ACTION = '/retrieve-password'
  static RESET_PASSWORD_LINK = withParams<{
    resetCode: string
  }>('/recuperation-mot-de-passe.html')

  static RESET_PASSWORD_ACTION = '/reset-password'
  static REDIRECT_BASED_ON_ROLE = '/go-to-user-dashboard'
  static SIGNUP = '/enregistrement.html'
  static SIGNUP_ACTION = '/enregistrement'
  static PROJECT_INVITATION = withParams<{
    projectAdmissionKey: string
  }>('/enregistrement.html')

  static ADMIN_DASHBOARD = '/admin/dashboard.html'
  static IMPORT_PROJECTS = '/admin/importer-candidats.html' // Keep separate from ADMIN_DASHBOARD, may change

  static PROJECT_DETAILS = (projectId?: Project['id']) => {
    const route = '/projet/:projectId/details.html'
    if (projectId) {
      return route.replace(':projectId', projectId)
    } else return route
  }

  static IMPORT_PROJECTS_ACTION = '/admin/importProjects'
  static ADMIN_LIST_PROJECTS = '/admin/dashboard.html'
  static ADMIN_LIST_REQUESTS = '/admin/demandes.html'
  static ADMIN_NOTIFY_CANDIDATES = withParams<{
    appelOffreId: string
    periodeId: string
  }>('/admin/notifier-candidats.html')

  static PREVIEW_CANDIDATE_CERTIFICATE = (project?: Project) => {
    const route = '/previsualiser-attestation/:projectId/*'
    if (project) {
      return route
        .replace(':projectId', project.id)
        .replace('*', 'aperçu-' + makeCertificateFilename(project, true))
    } else return route
  }

  static DOWNLOAD_CERTIFICATE_FILE = (projectId?: string, fileId?: string, filename?: string) => {
    const route = '/attestation/:projectId/:fileId/:filename'
    if (projectId && fileId && filename) {
      return route
        .replace(':projectId', projectId)
        .replace(':fileId', fileId)
        .replace(':filename', filename)
    } else return route
  }

  static CANDIDATE_CERTIFICATE_FOR_ADMINS = (project: Project) =>
    routes.DOWNLOAD_CERTIFICATE_FILE(
      project.id,
      project.certificateFile?.id,
      makeCertificateFilename(project, true)
    )

  static CANDIDATE_CERTIFICATE_FOR_CANDIDATES = (project: Project) =>
    routes.DOWNLOAD_CERTIFICATE_FILE(
      project.id,
      project.certificateFile?.id,
      makeCertificateFilename(project)
    )

  static ADMIN_NOTIFY_CANDIDATES_ACTION = '/admin/sendCandidateNotifications'
  static ADMIN_CORRECT_PROJECT_DATA_ACTION = '/admin/correctProjectData'
  static ADMIN_REPLY_TO_MODIFICATION_REQUEST = '/admin/replyToModificationRequest'
  static ADMIN_INVITE_DREAL_ACTION = '/admin/inviteDreal'
  static DREAL_INVITATION = withParams<{
    projectAdmissionKey: string
  }>('/enregistrement.html')

  static ADMIN_DREAL_LIST = '/admin/dreals.html'
  static ADMIN_INVITATION_LIST = '/admin/invitations.html'
  static ADMIN_INVITATION_RELANCE_ACTION = '/admin/relanceInvitations'
  static ADMIN_NOTIFICATION_LIST = '/admin/notifications.html'
  static ADMIN_NOTIFICATION_RETRY_ACTION = '/admin/retryNotifications'
  static GARANTIES_FINANCIERES_LIST = '/admin/garanties-financieres.html'

  static USER_DASHBOARD = '/mes-projets.html'
  static USER_LIST_PROJECTS = '/mes-projets.html'
  static USER_LIST_REQUESTS = '/mes-demandes.html'
  static DEMANDE_GENERIQUE = '/demande-modification.html'
  static DEPOSER_RECOURS = withProjectId('/demande-modification.html?action=recours')

  static DEMANDE_DELAIS = withProjectId('/demande-modification.html?action=delai')

  static CHANGER_FOURNISSEUR = withProjectId('/demande-modification.html?action=fournisseur')

  static CHANGER_ACTIONNAIRE = withProjectId('/demande-modification.html?action=actionnaire')

  static CHANGER_PUISSANCE = withProjectId('/demande-modification.html?action=puissance')

  static CHANGER_PRODUCTEUR = withProjectId('/demande-modification.html?action=producteur')

  static DEMANDER_ABANDON = withProjectId('/demande-modification.html?action=abandon')

  static DEMANDE_ACTION = '/soumettre-demande'
  static DOWNLOAD_PROJECT_FILE = (fileId?: string, filename?: string) => {
    const route = '/telechargement/:fileId/fichier/:filename'
    if (fileId && filename) {
      return route.replace(':fileId', fileId).replace(':filename', filename)
    } else return route
  }

  static DEMANDE_PAGE_DETAILS = (modificationRequestId?: string) => {
    const route = '/demande/:modificationRequestId/details.html'
    if (modificationRequestId) {
      return route.replace(':modificationRequestId', modificationRequestId)
    } else return route
  }

  static INVITE_USER_TO_PROJECT_ACTION = '/invite-user-to-project'

  static DEPOSER_GARANTIES_FINANCIERES_ACTION = '/deposer-garanties-financieres'
  static SUPPRIMER_GARANTIES_FINANCIERES_ACTION = (projectId?: Project['id']) => {
    const route = '/projet/:projectId/supprimer-garanties-financieres'
    if (projectId) {
      return route.replace(':projectId', projectId)
    } else return route
  }

  static TELECHARGER_MODELE_MISE_EN_DEMEURE = (project?: Project) => {
    const route = '/projet/:projectId/telecharger-mise-en-demeure/:filename'
    if (project) {
      return route
        .replace(':projectId', project.id)
        .replace(
          ':filename',
          sanitize(`Mise en demeure Garanties Financières - ${project.nomProjet}.docx`)
        )
    } else return route
  }

  static TELECHARGER_MODELE_REPONSE_RECOURS = (
    project?: Project,
    modificationRequestId?: string
  ) => {
    const route =
      '/projet/:projectId/demande/:modificationRequestId/telecharger-reponse-recours/:filename'
    if (project && modificationRequestId) {
      const now = new Date()
      return route
        .replace(':projectId', project.id)
        .replace(':modificationRequestId', modificationRequestId)
        .replace(
          ':filename',
          sanitize(
            `${now.getFullYear()}-${
              now.getMonth() + 1
            }-${now.getDate()} - Recours gracieux - ${makeProjectIdentifier(project)}.docx`
          )
        )
    } else return route
  }

  static DEPOSER_DCR_ACTION = '/deposer-dcr'
  static SUPPRIMER_DCR_ACTION = (projectId?: Project['id']) => {
    const route = '/projet/:projectId/supprimer-dcr'
    if (projectId) {
      return route.replace(':projectId', projectId)
    } else return route
  }
}

export default routes
