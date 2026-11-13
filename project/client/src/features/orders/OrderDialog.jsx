import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { formatCurrency } from '../../data/inventory.js'

function OrderDialog({ products, onClose, onCreate }) {
  const availableProducts = products.filter((product) => product.quantity > 0)
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState(() => (
    availableProducts.length
      ? [{ productId: availableProducts[0].id, quantity: '1' }]
      : []
  ))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const updateItem = (index, updates) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...updates } : item
    )))
    setError('')
  }

  const addItem = () => {
    const usedIds = new Set(items.map((item) => item.productId))
    const nextProduct = availableProducts.find((product) => !usedIds.has(product.id))
    if (!nextProduct) return

    setItems((current) => [...current, { productId: nextProduct.id, quantity: '1' }])
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const orderItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    }))

    if (!customerName.trim() || orderItems.length === 0
      || orderItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setError('Enter a customer name and valid product quantities')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onCreate({ customerName: customerName.trim(), items: orderItems })
    } catch (createError) {
      setError(createError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section
        aria-labelledby="order-dialog-title"
        aria-modal="true"
        className="product-dialog order-dialog"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
        role="dialog"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Fulfillment</p>
            <h2 id="order-dialog-title">Create order</h2>
          </div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Customer name
            <input
              autoFocus
              maxLength={160}
              onChange={(event) => {
                setCustomerName(event.target.value)
                setError('')
              }}
              required
              value={customerName}
            />
          </label>

          <div className="order-items">
            <div className="order-items__heading">
              <h3>Items</h3>
              <button
                className="text-button"
                disabled={items.length >= availableProducts.length || items.length >= 100}
                onClick={addItem}
                type="button"
              >
                <Plus aria-hidden="true" size={15} />
                Add item
              </button>
            </div>

            {items.map((item, index) => {
              const product = availableProducts.find((candidate) => candidate.id === item.productId)
              const usedByOtherItem = new Set(
                items.filter((_, itemIndex) => itemIndex !== index).map((otherItem) => otherItem.productId),
              )

              return (
                <div className="order-item-row" key={index}>
                  <label>
                    Product
                    <select
                      onChange={(event) => updateItem(index, { productId: event.target.value, quantity: '1' })}
                      required
                      value={item.productId}
                    >
                      {availableProducts.map((option) => (
                        <option disabled={usedByOtherItem.has(option.id)} key={option.id} value={option.id}>
                          {option.name} ({option.quantity} available)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Quantity
                    <input
                      max={product?.quantity ?? 1}
                      min="1"
                      onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      required
                      step="1"
                      type="number"
                      value={item.quantity}
                    />
                  </label>
                  <div className="order-item-row__meta">
                    <span>{product ? formatCurrency(product.price) : '—'} each</span>
                    {items.length > 1 && (
                      <button
                        aria-label={`Remove item ${index + 1}`}
                        className="icon-button"
                        onClick={() => {
                          setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                          setError('')
                        }}
                        type="button"
                      >
                        <X aria-hidden="true" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <p className="auth-hint">Prices and total are calculated from the current product catalog.</p>
          <div className="dialog-actions">
            <button className="button button--secondary" disabled={isSaving} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button button--primary" disabled={isSaving} type="submit">
              {isSaving ? 'Creating' : 'Create order'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default OrderDialog
