import { useState } from 'react'
import { X } from 'lucide-react'
import { formatCurrency, getProductStatus } from '../../data/inventory.js'

function ProductDialog({ canManage, product, onClose, onDelete, onSave }) {
  const [isEditing, setIsEditing] = useState(!product)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? 'Packaging',
    price: product?.price ?? '',
    quantity: product?.quantity ?? '',
    reorderLevel: product?.reorderLevel ?? '',
    stockReason: '',
  })

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const quantity = Number(form.quantity)
    const price = Number(form.price)
    const reorderLevel = Number(form.reorderLevel)
    const quantityChanged = Boolean(product) && quantity !== Number(product.quantity)

    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      setError('Product name, SKU, and category are required')
      return
    }

    if (!Number.isFinite(price)
      || price < 0
      || Math.abs(price * 100 - Math.round(price * 100)) >= 1e-8
      || !Number.isInteger(quantity)
      || quantity < 0
      || !Number.isInteger(reorderLevel)
      || reorderLevel < 0) {
      setError('Enter valid non-negative values for price, quantity, and reorder point')
      return
    }

    if (quantityChanged && !form.stockReason.trim()) {
      setError('Enter a reason for changing stock quantity')
      return
    }

    const nextProduct = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category,
      price,
      reorderLevel,
      ...(!product || quantityChanged ? { quantity } : {}),
      ...(quantityChanged ? { stockReason: form.stockReason.trim() } : {}),
    }

    setIsSaving(true)
    try {
      await onSave(nextProduct)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setError('')
    try {
      await onDelete(product.id)
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section
        aria-labelledby="product-dialog-title"
        aria-modal="true"
        className="product-dialog"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
        role="dialog"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{product ? (isEditing ? 'Catalog update' : product.sku) : 'Catalog'}</p>
            <h2 id="product-dialog-title">{product ? (isEditing ? 'Edit product' : product.name) : 'Add product'}</h2>
          </div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        {isEditing ? (
          <form className="product-form" onSubmit={handleSubmit}>
            <label>
              Product name
              <input autoFocus name="name" onChange={updateField} required value={form.name} />
            </label>
            <div className="form-grid">
              <label>
                SKU
                <input name="sku" onChange={updateField} required value={form.sku} />
              </label>
              <label>
                Category
                <select name="category" onChange={updateField} value={form.category}>
                  <option>Packaging</option>
                  <option>Storage</option>
                  <option>Shipping</option>
                  <option>Supplies</option>
                </select>
              </label>
              <label>
                Unit price
                <input min="0" name="price" onChange={updateField} required step="0.01" type="number" value={form.price} />
              </label>
              <label>
                Units on hand
                <input min="0" name="quantity" onChange={updateField} required step="1" type="number" value={form.quantity} />
              </label>
              <label className="form-grid__full">
                Reorder point
                <input min="0" name="reorderLevel" onChange={updateField} required step="1" type="number" value={form.reorderLevel} />
              </label>
              {product && Number(form.quantity) !== Number(product.quantity) && (
                <label className="form-grid__full">
                  Stock change reason
                  <input
                    maxLength={120}
                    name="stockReason"
                    onChange={updateField}
                    required
                    value={form.stockReason}
                  />
                </label>
              )}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="dialog-actions">
              <button className="button button--secondary" disabled={isSaving} onClick={product ? () => setIsEditing(false) : onClose} type="button">Cancel</button>
              <button className="button button--primary" disabled={isSaving} type="submit">{isSaving ? 'Saving' : product ? 'Save changes' : 'Add product'}</button>
            </div>
          </form>
        ) : (
          <div className="product-detail">
            <div className="product-detail__stock">
              <span className="product-detail__label">Units on hand</span>
              <strong>{product.quantity}</strong>
              <span className="product-detail__reorder">Reorder point: {product.reorderLevel}</span>
            </div>
            <dl className="detail-list">
              <div><dt>SKU</dt><dd>{product.sku}</dd></div>
              <div><dt>Category</dt><dd>{product.category}</dd></div>
              <div><dt>Unit price</dt><dd>{formatCurrency(product.price)}</dd></div>
              <div><dt>Status</dt><dd>{getProductStatus(product)}</dd></div>
              <div><dt>Last updated</dt><dd>{product.updated}</dd></div>
            </dl>
            <div className="dialog-actions">
              <button className="button button--secondary" onClick={onClose} type="button">Close</button>
              {canManage && <button className="button button--primary" onClick={() => setIsEditing(true)} type="button">Edit product</button>}
            </div>
            {canManage && (
              <button className="text-button product-delete" onClick={handleDelete} type="button">
                Archive product
              </button>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductDialog
