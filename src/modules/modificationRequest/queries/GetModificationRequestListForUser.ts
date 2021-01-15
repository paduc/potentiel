import { ResultAsync } from '../../../core/utils'
import { User } from '../../../entities'
import { PaginatedList } from '../../../types'
import { InfraNotAvailableError } from '../../shared'
import { ModificationRequestListItemDTO } from '../dtos'

export interface GetModificationRequestListForUser {
  (user: User): ResultAsync<PaginatedList<ModificationRequestListItemDTO>, InfraNotAvailableError>
}
