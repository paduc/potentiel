import isEmail from 'isemail'
import { String, Record, Union, Literal, Partial, Static } from '../types/schemaTypes'
import buildMakeEntity from '../helpers/buildMakeEntity'

const baseUserSchema = Record({
  id: String,
  fullName: String,
  email: String.withConstraint(isEmail.validate),
  role: Union(Literal('admin'), Literal('dgec'), Literal('porteur-projet'), Literal('dreal')),
})

const userSchema = baseUserSchema.And(
  Partial({
    projectAdmissionKey: String,
  })
)

const fields: string[] = ['projectAdmissionKey', ...Object.keys(baseUserSchema.fields)]

type User = Static<typeof userSchema>

interface MakeUserDependencies {
  makeId: () => string
}

export default ({ makeId }: MakeUserDependencies) =>
  buildMakeEntity<User>(userSchema, makeId, fields)

export { User, userSchema }
