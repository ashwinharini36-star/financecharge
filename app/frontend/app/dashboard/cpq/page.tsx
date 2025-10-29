'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotesApi, customersApi, productsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Check, X } from 'lucide-react'
import { CreateQuoteDialog } from '@/components/cpq/create-quote-dialog'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function getStatusBadge(status: string) {
  const variants = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
}

export default function CPQPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const queryClient = useQueryClient()

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => quotesApi.list().then(res => res.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => quotesApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })

  const convertMutation = useMutation({
    mutationFn: (id: string) => quotesApi.convertToInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading quotes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CPQ & Quotes</h1>
          <p className="text-muted-foreground">
            Configure, price, and quote products for customers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quote
        </Button>
      </div>

      <div className="grid gap-4">
        {quotes?.data?.map((quote: any) => (
          <Card key={quote.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">Quote #{quote.id.slice(-8)}</h3>
                    <Badge className={getStatusBadge(quote.status)}>
                      {quote.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {quote.customer.name} • {formatCurrency(quote.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quote.items.length} item(s) • Created {new Date(quote.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  {quote.status === 'draft' && (
                    <Button 
                      size="sm"
                      onClick={() => approveMutation.mutate(quote.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  
                  {quote.status === 'approved' && (
                    <Button 
                      size="sm"
                      onClick={() => convertMutation.mutate(quote.id)}
                      disabled={convertMutation.isPending}
                    >
                      Convert to Invoice
                    </Button>
                  )}
                </div>
              </div>

              {/* Quote Items */}
              <div className="mt-4 space-y-2">
                {quote.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>{item.product.name} × {item.qty}</span>
                    <span>{formatCurrency(item.qty * item.unit_amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateQuoteDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
