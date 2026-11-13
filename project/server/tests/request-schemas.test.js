import assert from 'node:assert/strict'
import test from 'node:test'
import { registerSchema } from '../src/validators/auth.schemas.js'
import {
  createProductSchema,
  idSchema,
  updateProductSchema,
} from '../src/validators/product.schemas.js'
import { createOrderSchema } from '../src/validators/order.schemas.js'
import { createStockMovementSchema } from '../src/validators/stockMovement.schemas.js'
import { updateUserRoleSchema } from '../src/validators/user.schemas.js'

test('registration normalizes email and never accepts a caller-selected role', () => {
  const result = registerSchema.parse({
    name: ' Riley Kim ',
    email: '  Riley@Example.com ',
    password: 'a long enough passphrase',
    role: 'admin',
  })

  assert.equal(result.name, 'Riley Kim')
  assert.equal(result.email, 'riley@example.com')
  assert.equal('role' in result, false)
})

test('password validation rejects values bcrypt would truncate', () => {
  const validPassword = '€'.repeat(24)
  const truncatedPassword = '€'.repeat(25)

  assert.equal(registerSchema.safeParse({
    name: 'Riley Kim',
    email: 'riley@example.com',
    password: validPassword,
  }).success, true)
  assert.equal(registerSchema.safeParse({
    name: 'Riley Kim',
    email: 'riley@example.com',
    password: truncatedPassword,
  }).success, false)
})

test('product validation enforces money precision and stock-change reasons', () => {
  assert.equal(createProductSchema.safeParse({
    name: 'Tape',
    sku: 'tap-1',
    category: 'Packing',
    price: 4.25,
    quantity: 3,
    reorderLevel: 1,
  }).success, true)

  assert.equal(createProductSchema.safeParse({
    name: 'Tape',
    sku: 'tap-1',
    category: 'Packing',
    price: 4.257,
    quantity: 3,
    reorderLevel: 1,
  }).success, false)

  assert.equal(updateProductSchema.safeParse({ quantity: 4 }).success, false)
  assert.equal(updateProductSchema.safeParse({
    quantity: 4,
    stockReason: 'Cycle count correction',
  }).success, true)
})

test('IDs are safe positive bigint strings', () => {
  assert.equal(idSchema.safeParse('42').success, true)
  assert.equal(idSchema.safeParse('0').success, false)
  assert.equal(idSchema.safeParse('not-an-id').success, false)
  assert.equal(idSchema.safeParse('9223372036854775808').success, false)
})

test('orders reject duplicate product lines and require a customer name', () => {
  const baseItem = { productId: '4', quantity: 2 }

  assert.equal(createOrderSchema.safeParse({
    customerName: 'Northwind Supply',
    items: [baseItem],
  }).success, true)

  assert.equal(createOrderSchema.safeParse({
    customerName: 'Northwind Supply',
    items: [baseItem, baseItem],
  }).success, false)

  assert.equal(createOrderSchema.safeParse({
    items: [baseItem],
  }).success, false)
})

test('stock adjustments must be non-zero and roles must be recognized', () => {
  assert.equal(createStockMovementSchema.safeParse({
    productId: '2',
    quantityChange: 1,
    reason: 'Stock count',
  }).success, true)

  assert.equal(createStockMovementSchema.safeParse({
    productId: '2',
    quantityChange: 0,
    reason: 'Stock count',
  }).success, false)

  assert.equal(updateUserRoleSchema.safeParse({ role: 'inventory_manager' }).success, true)
  assert.equal(updateUserRoleSchema.safeParse({ role: 'owner' }).success, false)
})
