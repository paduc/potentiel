import { Success, Redirect } from '../helpers/responses'
import { HttpRequest } from '../types'
import { SignupPage } from '../views/pages'
import { projectAdmissionKeyRepo, credentialsRepo } from '../dataAccess'
import routes from '../routes'
import { logger } from '../core/utils/logger'

const getSignupPage = async (request: HttpRequest) => {
  const projectAdmissionKeyId = request.query.projectAdmissionKey
  if (!projectAdmissionKeyId) {
    return Redirect(routes.HOME)
  }

  const projectAdmissionKeyResult = await projectAdmissionKeyRepo.findById(projectAdmissionKeyId)

  if (projectAdmissionKeyResult.is_none()) {
    // Key doesnt exist
    logger.error(
      new Error(
        `getSignupPage called with a projectAdmissionKey that could not be found : ${projectAdmissionKeyId}`
      )
    )
    return Redirect(routes.HOME)
  }

  const projectAdmissionKey = projectAdmissionKeyResult.unwrap()

  let logoutUser = false
  if (request.user) {
    // User is already logged in

    if (projectAdmissionKey.email === request.user.email) {
      // User is already logged in with the same email
      // Redirect to project list
      return Redirect(routes.USER_LIST_PROJECTS)
    }
    // User is already logged in with a different email
    // Log him out
    logoutUser = true
  } else {
    const existingCredentialsForEmail = await credentialsRepo.findByEmail(projectAdmissionKey.email)

    if (existingCredentialsForEmail.is_some()) {
      // User is not logged in but account exists with this email, redirect to login
      return Redirect(routes.LOGIN, { email: projectAdmissionKey.email })
    }
  }

  // Display the signup page
  return Success(
    SignupPage({
      request,
      projectAdmissionKey,
    }),
    { logout: logoutUser }
  )
}
export { getSignupPage }
