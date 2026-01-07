// Shopify Admin API client for server-side operations

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN
const API_VERSION = '2025-01'

interface ShopifyAdminResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

async function shopifyAdminFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error('Shopify Admin API credentials not configured')
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  )

  const json: ShopifyAdminResponse<T> = await response.json()

  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'Shopify Admin API error')
  }

  return json.data
}

export interface ShopifyOrder {
  id: string
  name: string // Order number like #1001
  createdAt: string
  email: string
  totalPriceSet: {
    shopMoney: {
      amount: string
      currencyCode: string
    }
  }
  displayFulfillmentStatus: string
  displayFinancialStatus: string
  lineItems: {
    edges: Array<{
      node: {
        title: string
        quantity: number
        originalTotalSet: {
          shopMoney: {
            amount: string
          }
        }
      }
    }>
  }
}

interface OrdersQueryResponse {
  orders: {
    edges: Array<{
      node: ShopifyOrder
    }>
  }
}

export async function getOrdersByEmail(email: string): Promise<ShopifyOrder[]> {
  const query = `
    query GetOrdersByEmail($query: String!) {
      orders(first: 20, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            email
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            displayFulfillmentStatus
            displayFinancialStatus
            lineItems(first: 50) {
              edges {
                node {
                  title
                  quantity
                  originalTotalSet {
                    shopMoney {
                      amount
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const data = await shopifyAdminFetch<OrdersQueryResponse>(query, {
    query: `email:"${email}"`,
  })

  return data.orders.edges.map((edge) => edge.node)
}
