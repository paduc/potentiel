import { logger } from '../core/utils/logger'
import { CredentialsRepo, PasswordRetrievalRepo } from '../dataAccess'
import { makeCredentials, PasswordRetrieval } from '../entities'
import { ErrorResult, Ok, ResultAsync } from '../types'

interface MakeUseCaseProps {
  passwordRetrievalRepo: PasswordRetrievalRepo
  credentialsRepo: CredentialsRepo
}

interface CallUseCaseProps {
  password: string
  confirmPassword: string
  resetCode: PasswordRetrieval['id']
}

export const PASSWORD_MISMATCH_ERROR = 'Les mots de passe ne correspondent pas.'
export const ILLEGAL_RESET_CODE_ERROR = "Le lien de récupération de mot de passe n'est pas valable."
export const SYSTEM_ERROR =
  "Votre demande n'a pas pu être traitée, merci de réessayer ou de contacter un administrateur."

export default function makeResetPassword({
  passwordRetrievalRepo,
  credentialsRepo,
}: MakeUseCaseProps) {
  return async function resetPassword({
    password,
    confirmPassword,
    resetCode,
  }: CallUseCaseProps): ResultAsync<null> {
    // Check resetCode
    const passwordRetrievalResult = await passwordRetrievalRepo.findById(resetCode)

    if (passwordRetrievalResult.is_none()) {
      return ErrorResult(ILLEGAL_RESET_CODE_ERROR)
    }

    const passwordRetrieval = passwordRetrievalResult.unwrap()

    // Check if passwords match
    if (!password || password !== confirmPassword) {
      return ErrorResult(PASSWORD_MISMATCH_ERROR)
    }

    // Check if credentials exist
    const credentialsResult = await credentialsRepo.findByEmail(passwordRetrieval.email)

    if (credentialsResult.is_none()) {
      logger.error(
        new Error(
          'resetPassword use-case called, resetCode is linked to email for which we have no credentials'
        )
      )
      return ErrorResult(ILLEGAL_RESET_CODE_ERROR)
    }

    const credentials = credentialsResult.unwrap()

    // Update the credentials with the new password
    const newCredentialsResult = makeCredentials({
      ...credentials,
      hash: undefined,
      password,
    })

    if (newCredentialsResult.is_err()) {
      logger.error(newCredentialsResult.unwrap_err())
      return ErrorResult(SYSTEM_ERROR)
    }

    const newCredentials = newCredentialsResult.unwrap()

    const insertionResult = await credentialsRepo.update(credentials.id, newCredentials.hash)

    if (insertionResult.is_err()) {
      logger.error(insertionResult.unwrap_err())
      return ErrorResult(SYSTEM_ERROR)
    }

    // Delete the passwordRetrieval entity
    await passwordRetrievalRepo.remove(passwordRetrieval.id)

    return Ok(null)
  }
}
