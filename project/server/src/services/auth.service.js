import bcrypt from 'bcryptjs'
import * as userModel from '../models/User.js'

const bcryptRounds = 12
const dummyPasswordHash = '$2b$12$7ID68J02dGyVnM98fgLhHuIxWf/YngqPLfVVEqU7ZBc3bueza0Oya'

export async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, bcryptRounds)
  return userModel.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  })
}

export async function authenticateUser({ email, password }) {
  const user = await userModel.findUserForLogin(email)
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? dummyPasswordHash,
  )

  if (!user || !user.isActive || !passwordMatches) {
    return null
  }

  const { passwordHash: _passwordHash, ...publicUser } = user
  return publicUser
}
