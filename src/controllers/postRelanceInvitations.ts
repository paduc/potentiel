import { Redirect } from '../helpers/responses'
import ROUTES from '../routes'
import { HttpRequest } from '../types'
import { relanceInvitations } from '../useCases'
import moment from 'moment'

const postRelanceInvitations = async (request: HttpRequest) => {
  // console.log('Call to sendCandidateNotifications received', request.body)

  if (!request.user || request.user.role !== 'admin') {
    return Redirect(ROUTES.LOGIN)
  }

  const result = await relanceInvitations({})

  return result.match({
    ok: (sentRelances: number) =>
      Redirect(ROUTES.ADMIN_INVITATION_LIST, {
        success: sentRelances
          ? `${sentRelances} relances ont été envoyées`
          : `Aucun relance n\'a été envoyée. Merci de vérifier qu'il y a bien des invitations à relancer.`,
      }),
    err: (e: Error) => {
      console.log('postRelanceInvitations failed', e)
      return Redirect(ROUTES.ADMIN_INVITATION_LIST, {
        error: `Les relances n'ont pas pu être envoyées. (Erreur: ${e.message})`,
      })
    },
  })
}
export { postRelanceInvitations }