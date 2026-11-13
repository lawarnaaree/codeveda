import { useState } from 'react'
import { X } from 'lucide-react'
import { formatCurrency, getProductStatus } from '../../data/inventory.js'

function ProductDialog({ product, onClose, onDelete, onSave }) {
  const [isEditing, setIsEditing] = useState(!product)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? 'Packaging',
    price: product?.price ?? '',
    quantity: product?.quantity ?? '',
    reorderLevel: product?.reorderLevel ?? '',
  })

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const quantity = Number(form.quantity)
    const price = Number(form.price)
    const reorderLevel = Number(form.reorderLevel)

    if (!form.name.trim() || !form.sku.trim()) {
      setError('Product name and SKU are required')
      return
    }

    if ([quantity, price, reorderLevel].some((value) => !Number.isFinite(value) || value < 0)) {
      setError('Enter valid non-negative values for price, quantity, and reorder point')
      return
    }

    onSave({
      id: product?.id ?? `p-${Date.now()}`,
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category,
      price,
      quantity,
      reorderLevel,
      updated: 'Just now',
    })
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
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="dialog-actions">
              <button className="button button--secondary" onClick={product ? () => setIsEditing(false) : onClose} type="button">Cancel</button>
              <button className="button button--primary" type="submit">{product ? 'Save changes' : 'Add product'}</button>
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
              <div><dt>Unit price</dt><dd>{formatCurrency(Number(product.price))}</dd></div>
              <div><dt>Status</dt><dd>{getProductStatus(product)}</dd></div>
              <div><dt>Last updated</dt><dd>{product.updated}</dd></div>
            </dl>
            <div className="dialog-actions">
              <button className="button button--secondary" onClick={onClose} type="button">Close</button>
              <button className="button button--primary" onClick={() => setIsEditing(true)} type="button">Edit product</button>
            </div>
            <button className="text-button product-delete" onClick={() => onDelete(product.id)} type="button">
              Delete product
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductDialog
