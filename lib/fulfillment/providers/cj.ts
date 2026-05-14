import { cjRequest } from '@/lib/cj'
import type { FulfillmentProvider, SupplierOrderPayload, SupplierOrderResult } from '@/lib/fulfillment/types'

function shouldDryRun() {
  return process.env.CJ_FULFILLMENT_DRY_RUN !== 'false'
}

function buildCJOrderPayload(payload: SupplierOrderPayload) {
  const address = payload.shippingAddress
  return {
    orderNumber: payload.orderNumber,
    shippingZip: address.postalCode,
    shippingCountryCode: address.countryCode || address.country,
    shippingCountry: address.country,
    shippingProvince: address.province || '',
    shippingCity: address.city,
    shippingAddress: [address.address1, address.address2].filter(Boolean).join(' '),
    shippingCustomerName: address.name || [address.firstName, address.lastName].filter(Boolean).join(' '),
    shippingPhone: address.phone || '',
    email: payload.customerEmail,
    products: payload.items.map((item) => ({
      vid: item.supplierVariantId || '',
      pid: item.supplierProductId || '',
      sku: item.supplierSku || item.platformVariantSku || '',
      quantity: item.quantity,
    })),
    remark: `Vyron/ASORTA order ${payload.orderNumber}`,
  }
}

export const cjFulfillmentProvider: FulfillmentProvider = {
  key: 'cj',
  async submitOrder(payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
    const body = buildCJOrderPayload(payload)

    if (shouldDryRun()) {
      return {
        supplier: 'cj',
        status: 'dry_run',
        message: 'CJ dry-run: order payload prepared but not sent. Set CJ_FULFILLMENT_DRY_RUN=false after testing.',
        raw: body,
      }
    }

    try {
      const response = await cjRequest<{ orderId?: string; orderNum?: string; id?: string }>('/shopping/order/createOrderV3', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const supplierOrderId = response.data?.orderId || response.data?.orderNum || response.data?.id || payload.orderNumber
      return {
        supplier: 'cj',
        status: 'submitted',
        supplierOrderId,
        message: `CJ order submitted: ${supplierOrderId}`,
        raw: response,
      }
    } catch (error) {
      return {
        supplier: 'cj',
        status: 'failed',
        message: error instanceof Error ? error.message : 'CJ fulfilment failed.',
        raw: { body },
      }
    }
  },
}
