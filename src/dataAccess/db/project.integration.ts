import { Sequelize } from 'sequelize'
import { expect } from 'chai'
import { v4 as uuid } from 'uuid'
import { ProjectRepo } from '../project'
import { makeProjectRepo } from './project'
import { makeUserRepo } from './user'
import { appelOffreRepo } from '../inMemory/appelOffre'
import { UserRepo } from '../user'
import makeFakeProject from '../../__tests__/fixtures/project'
import makeFakeUser from '../../__tests__/fixtures/user'

import {
  userRepo,
  projectRepo,
  initDatabase,
  resetDatabase,
  sequelize,
} from './'
import { Pagination } from '../../types'

const defaultPagination = { page: 0, pageSize: 10 } as Pagination

describe('projectRepo sequelize', () => {
  before(async () => {
    await initDatabase()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  describe('findAll', () => {
    it('should return all projects', async () => {
      await Promise.all(
        [
          {
            id: uuid(),
          },
          {
            id: uuid(),
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      const results = await projectRepo.findAll()
      expect(results).to.have.lengthOf(2)
    })
  })

  describe('findAllForUser', () => {
    it('should only return user projects', async () => {
      const userId = uuid()

      await userRepo.insert(
        makeFakeUser({
          id: userId,
        })
      )

      const userProjectId = uuid()

      await Promise.all(
        [
          {
            // Good user, matches query
            id: userProjectId,
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 1,
          },
          {
            // Bad user, matches query
            id: uuid(),
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 1,
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      await userRepo.addProject(userId, userProjectId)

      const results = await projectRepo.findAllForUser(
        userId,
        defaultPagination,
        {
          isNotified: true,
          hasGarantiesFinancieres: true,
          isClasse: true,
        }
      )

      expect(results.itemCount).to.equal(1)
      expect(results.items[0].id).to.equal(userProjectId)
    })

    it('should return projects that match the query', async () => {
      const userId = uuid()

      await userRepo.insert(
        makeFakeUser({
          id: userId,
        })
      )

      const userProjectId1 = uuid()
      const userProjectId2 = uuid()
      const userProjectId3 = uuid()
      const userProjectId4 = uuid()

      await Promise.all(
        [
          {
            // Good user, matches filter
            id: userProjectId1,
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 1,
          },
          {
            // Good user, does not match all filters
            id: userProjectId2,
            garantiesFinancieresSubmittedOn: 0,
            classe: 'Classé',
            notifiedOn: 1,
          },
          {
            // Good user, does not match all filters
            id: userProjectId3,
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Eliminé',
            notifiedOn: 1,
          },
          {
            // Good user, does not match all filters
            id: userProjectId4,
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 0,
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      await userRepo.addProject(userId, userProjectId1)
      await userRepo.addProject(userId, userProjectId2)
      await userRepo.addProject(userId, userProjectId3)
      await userRepo.addProject(userId, userProjectId4)

      const results = await projectRepo.findAllForUser(
        userId,
        defaultPagination,
        {
          isNotified: true,
          hasGarantiesFinancieres: true,
          isClasse: true,
        }
      )

      expect(results.itemCount).to.equal(1)
      expect(results.items[0].id).to.equal(userProjectId1)
    })
  })

  describe('searchForUser', () => {
    it('should return projects that contain the search term', async () => {
      const userId = uuid()

      await userRepo.insert(
        makeFakeUser({
          id: userId,
        })
      )

      const userProjectId1 = uuid()
      const userProjectId2 = uuid()

      await Promise.all(
        [
          {
            // Good user, good search term
            id: userProjectId1,
            nomCandidat: 'the search term is there',
          },
          {
            // Good user, bad search term
            id: userProjectId2,
            nomCandidat: 'nothing to see here',
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      await userRepo.addProject(userId, userProjectId1)
      await userRepo.addProject(userId, userProjectId2)

      const results = await projectRepo.searchForUser(
        userId,
        'term',
        defaultPagination
      )

      expect(results.itemCount).to.equal(1)
      expect(results.items[0].id).to.equal(userProjectId1)
    })

    it('should only return user projects', async () => {
      const userId = uuid()

      await userRepo.insert(
        makeFakeUser({
          id: userId,
        })
      )

      const userProjectId = uuid()

      await Promise.all(
        [
          {
            // Good user, good search term
            id: userProjectId,
            nomCandidat: 'the search term is there',
          },
          {
            // Bad user, good search term
            id: uuid(),
            nomCandidat: 'the search term is there',
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      await userRepo.addProject(userId, userProjectId)

      const results = await projectRepo.searchForUser(
        userId,
        'term',
        defaultPagination
      )

      expect(results.itemCount).to.equal(1)
      expect(results.items[0].id).to.equal(userProjectId)
    })

    it('should return projects that match all the filters', async () => {
      const userId = uuid()

      await userRepo.insert(
        makeFakeUser({
          id: userId,
        })
      )

      const userProjectId1 = uuid()
      const userProjectId2 = uuid()
      const userProjectId3 = uuid()
      const userProjectId4 = uuid()

      await Promise.all(
        [
          {
            // Good user, good search term, matches filter
            id: userProjectId1,
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 1,
          },
          {
            // Good user, good search term, does not match all filters
            id: userProjectId2,
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 0,
            classe: 'Classé',
            notifiedOn: 1,
          },
          {
            // Good user, good search term, does not match all filters
            id: userProjectId3,
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Eliminé',
            notifiedOn: 1,
          },
          {
            // Good user, good search term, does not match all filters
            id: userProjectId4,
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 0,
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      await userRepo.addProject(userId, userProjectId1)
      await userRepo.addProject(userId, userProjectId2)
      await userRepo.addProject(userId, userProjectId3)
      await userRepo.addProject(userId, userProjectId4)

      const results = await projectRepo.searchForUser(
        userId,
        'term',
        defaultPagination,
        {
          isNotified: true,
          hasGarantiesFinancieres: true,
          isClasse: true,
        }
      )

      expect(results.itemCount).to.equal(1)
      expect(results.items[0].id).to.equal(userProjectId1)
    })
  })

  describe('searchForRegions', () => {
    it('should return projects that contain the search term', async () => {
      const regionProjectId = uuid()

      await Promise.all(
        [
          {
            // Good region, contains search term
            id: regionProjectId,
            regionProjet: 'Corse',
            nomCandidat: 'the search term is there',
          },
          {
            // Good region, bad search term
            id: uuid(),
            regionProjet: 'Corse',
            nomCandidat: 'nothing to see here',
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      const results = await projectRepo.searchForRegions(
        'Corse',
        'term',
        defaultPagination
      )

      expect(results.itemCount).to.equal(1)
      expect(results.items[0].id).to.equal(regionProjectId)
    })

    describe('when a single region is given', () => {
      it('should only return projects from the region', async () => {
        const regionProjectId1 = uuid()
        const regionProjectId2 = uuid()

        await Promise.all(
          [
            {
              // Good region, contains search term
              id: regionProjectId1,
              regionProjet: 'Corse',
              nomCandidat: 'the search term is there',
            },
            {
              // Good region, contains search term
              id: regionProjectId2,
              regionProjet: 'Occitanie / Corse / Bretagne',
              nomCandidat: 'the search term is there',
            },
            {
              // Bad region, good search term
              id: uuid(),
              regionProjet: 'Bretagne',
              nomCandidat: 'the search term is there',
            },
          ]
            .map(makeFakeProject)
            .map(projectRepo.save)
        )

        const results = await projectRepo.searchForRegions(
          'Corse',
          'term',
          defaultPagination
        )

        expect(results.itemCount).to.equal(2)
        expect(results.items.map((item) => item.id)).to.include.members([
          regionProjectId1,
          ,
          regionProjectId2,
        ])
      })
    })

    describe('when multiple regions are given', () => {
      it('should only return projects from at least one of the regions', async () => {
        const regionProjectId1 = uuid()
        const regionProjectId2 = uuid()

        await Promise.all(
          [
            {
              // Good region, contains search term
              id: regionProjectId1,
              regionProjet: 'Corse',
              nomCandidat: 'the search term is there',
            },
            {
              // Good region, contains search term
              id: regionProjectId2,
              regionProjet: 'Occitanie / Bretagne',
              nomCandidat: 'the search term is there',
            },
            {
              // Bad region, good search term
              id: uuid(),
              regionProjet: 'Bretagne',
              nomCandidat: 'the search term is there',
            },
          ]
            .map(makeFakeProject)
            .map(projectRepo.save)
        )

        const results = await projectRepo.searchForRegions(
          ['Corse', 'Occitanie'],
          'term',
          defaultPagination
        )

        expect(results.itemCount).to.equal(2)
        expect(results.items.map((item) => item.id)).to.include.members([
          regionProjectId1,
          ,
          regionProjectId2,
        ])
      })
    })

    it('should return projects that match all the filters', async () => {
      const regionProjectId1 = uuid()

      await Promise.all(
        [
          {
            // Good region, good search term, matches filter
            id: regionProjectId1,
            regionProjet: 'Corse',
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 1,
          },
          {
            // Good region, good search term, does not match all filters
            id: uuid(),
            regionProjet: 'Corse',
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 0,
            classe: 'Classé',
            notifiedOn: 1,
          },
          {
            // Good region, good search term, does not match all filters
            id: uuid(),
            regionProjet: 'Corse',
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Eliminé',
            notifiedOn: 1,
          },
          {
            // Good region, good search term, does not match all filters
            id: uuid(),
            regionProjet: 'Corse',
            nomCandidat: 'the search term is there',
            garantiesFinancieresSubmittedOn: 1,
            classe: 'Classé',
            notifiedOn: 0,
          },
        ]
          .map(makeFakeProject)
          .map(projectRepo.save)
      )

      const results = await projectRepo.searchForRegions(
        'Corse',
        'term',
        defaultPagination,
        {
          isNotified: true,
          hasGarantiesFinancieres: true,
          isClasse: true,
        }
      )

      expect(results.itemCount).to.equal(1)
      expect(results.items[0].id).to.equal(regionProjectId1)
    })
  })
})
