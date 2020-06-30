import { Project, User, AppelOffre, Famille, Periode, DREAL } from '../entities'
import { OptionAsync, ResultAsync, Pagination, PaginatedList } from '../types'

export interface ProjectFilters {
  isNotified: boolean
  hasGarantiesFinancieres: boolean
  isClasse: boolean
}

export type ProjectRepo = {
  findById: (
    id: Project['id'],
    includeHistory?: boolean
  ) => OptionAsync<Project>
  findOne(query: Record<string, any>): Promise<Project | undefined>

  searchForUser(
    userId: User['id'],
    terms: string,
    pagination: Pagination,
    filters?: ProjectFilters
  ): Promise<PaginatedList<Project>>

  findAllForUser(
    userId: User['id'],
    pagination: Pagination,
    filters?: ProjectFilters
  ): Promise<PaginatedList<Project>>

  searchForRegions(
    regions: DREAL | DREAL[],
    terms: string,
    pagination: Pagination,
    filters?: ProjectFilters
  ): Promise<PaginatedList<Project>>
  // findAllForRegions(
  //   regions: DREAL[],
  //   pagination: Pagination,
  //   query?: ProjectFilters
  // ): Promise<PaginatedList<Project>>

  findAll(query?: ProjectFilters): Promise<Array<Project>>
  findAll(
    query: ProjectFilters,
    pagination: Pagination
  ): Promise<PaginatedList<Project>>

  findExistingAppelsOffres(
    query?: ProjectFilters
  ): Promise<Array<AppelOffre['id']>>
  findExistingPeriodesForAppelOffre(
    appelOffreId: AppelOffre['id'],
    query?: ProjectFilters
  ): Promise<Array<Periode['id']>>
  findExistingFamillesForAppelOffre(
    appelOffreId: AppelOffre['id'],
    query?: ProjectFilters
  ): Promise<Array<Famille['id']>>

  remove: (projectId: Project['id']) => ResultAsync<void>
  save: (project: Project) => ResultAsync<Project>
  getUsers: (projectId: Project['id']) => Promise<Array<User>>
}
