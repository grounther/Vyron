export type SupplierKey = 'cj' | 'dsers' | 'manual'

export type FulfillmentAddress = {
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  address1: string
  address2?: string
  city: string
  postalCode: string
  province?: string
  country: string
  countryCode?: string
}

export type FulfillmentItem = {
  productSlug: string
  productName: string
  quantity: number
  unitPrice: number
  supplier: SupplierKey
  supplierProductId?: string
  supplierVariantId?: string
  supplierSku?: string
  supplierShippingMethod?: string
  platformVariantSku?: string
  raw?: Record<string, unknown>
}

export type SupplierOrderPayload = {
  orderId: string
  orderNumber: string
  customerEmail: string
  shippingAddress: FulfillmentAddress
  items: FulfillmentItem[]
  currency: string
  totalAmount: number
}

export type SupplierOrderResult = {
  supplier: SupplierKey
  status: 'dry_run' | 'submitted' | 'pending_bridge' | 'manual_required' | 'failed'
  supplierOrderId?: string
  supplierPaymentId?: string
  message: string
  raw?: unknown
}

export interface FulfillmentProvider {
  key: SupplierKey
  submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult>
}
