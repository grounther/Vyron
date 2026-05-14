import type { FulfillmentProvider, SupplierOrderPayload, SupplierOrderResult } from '@/lib/fulfillment/types'

export const manualFulfillmentProvider: FulfillmentProvider = {
  key: 'manual',
  async submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
    return {
      supplier: 'manual',
      status: 'manual_required',
      message: `Manual supplier mapping required for order ${payload.orderNumber}.`,
      raw: payload,
    }
  },
}
