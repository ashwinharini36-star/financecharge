'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotesApi, customersApi, productsApi } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface QuoteItem {
  product_id: string
  qty: number
  unit_amount: number
  discount_percent: number
}

interface CreateQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateQuoteDialog({ open, onOpenChange }: CreateQuoteDialogProps) {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([
    { product_id: '', qty: 1, unit_amount: 0, discount_percent: 0 }
  ])
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list().then(res => res.data),
    enabled: open,
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then(res => res.data),
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => quotesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      onOpenChange(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setCustomerId('')
    setItems([{ product_id: '', qty: 1, unit_amount: 0, discount_percent: 0 }])
  }

  const addItem = () => {
    setItems([...items, { product_id: '', qty: 1, unit_amount: 0, discount_percent: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-populate unit_amount when product is selected
    if (field === 'product_id' && products) {
      const product = products.find((p: any) => p.id === value)
      if (product && product.prices?.[0]) {
        newItems[index].unit_amount = product.prices[0].unit_amount
      }
    }
    
    setItems(newItems)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validItems = items.filter(item => 
      item.product_id && item.qty > 0 && item.unit_amount > 0
    )
    
    if (!customerId || validItems.length === 0) {
      return
    }

    createMutation.mutate({
      customer_id: customerId,
      currency: 'INR',
      items: validItems,
    })
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      if (!item.product_id || !item.qty || !item.unit_amount) return total
      const lineTotal = item.qty * item.unit_amount
      const discount = lineTotal * (item.discount_percent / 100)
      return total + (lineTotal - discount)
    }, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
          <DialogDescription>
            Add products and pricing to create a quote for your customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.data?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Quote Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                <div className="col-span-4">
                  <Label>Product</Label>
                  <Select 
                    value={item.product_id} 
                    onValueChange={(value) => updateItem(index, 'product_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={item.qty}
                    onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Unit Price (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_amount / 100}
                    onChange={(e) => updateItem(index, 'unit_amount', Math.round((parseFloat(e.target.value) || 0) * 100))}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.discount_percent}
                    onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-1">
                  <Label>Line Total</Label>
                  <div className="text-sm font-medium">
                    ₹{((item.qty * item.unit_amount * (1 - item.discount_percent / 100)) / 100).toFixed(2)}
                  </div>
                </div>

                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-semibold">
              Subtotal: ₹{(calculateTotal() / 100).toFixed(2)}
            </div>
            <div className="text-lg font-semibold">
              Total (incl. 18% GST): ₹{(calculateTotal() * 1.18 / 100).toFixed(2)}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Quote'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
