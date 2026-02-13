import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Listing {
  id: string
  name: string
  description: string
  images: string[]
  price: number | null
  displayPrice: string
  vendorName?: string
  vendorId?: string
  vendorPhone?: string | null
  whatsappUrl?: string | null
  createdAt?: string
  brand?: string
  productType?: string
  size?: string
  condition?: string
  gender?: string
}

interface ProductPageProps {
  loggedIn: boolean
  onRequireAuth: () => void
  onlogout?: () => void
  onWhatsApp?: (
    vendorId: string,
    itemName: string,
    itemid: string,
    onLogout: () => void
  ) => void
}

export default function ProductPage({
  loggedIn,
  onRequireAuth,
  onlogout,
  onWhatsApp,
}: ProductPageProps) {
  const { id } = useParams()
  const [product, setProduct] = useState<Listing | null>(null)
  const [activeImg, setActiveImg] = useState('')
  const [loading, setLoading] = useState(true)
function normalizeImages(images: any): string[] {
  if (!images) return [];

  const arr = Array.isArray(images) ? images : [images];

  return arr
    .filter(Boolean)
    .map((img: string) =>
      img.replace(/['{}"]/g, '') // removes ', {, }, "
    )
    .filter(Boolean);
}


  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const baseUrl = import.meta.env.VITE_RUNPOD_URL || 'http://localhost:4000'
        const res = await fetch(`${import.meta.env.VITE_RUNPOD_URL}/api/product/getproduct/${id}`)
        const json = await res.json()
        if (json?.data?.success) {
          const item = json.data.data
          
          const normalized: Listing = {
            ...item,
            name: item.description?.split('\n')[0] || 'Untitled',
            images:normalizeImages(item.images),
          }
          console.log(normalized.images)
          setProduct(normalized)
          setActiveImg(normalized.images[0])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleWhatsApp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!loggedIn) return onRequireAuth()
      if (!product) return
      const name = product.name || product.description || ''
      onWhatsApp?.(product.vendorId!, name, product.id, onlogout!)
    },
    [loggedIn, product, onWhatsApp, onlogout, onRequireAuth]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Product not found</p>
        <Link to="/" className="text-sky-400 text-sm hover:underline">
          Back to feed
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sky-400"
        >
          ← Back to feed
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Images */}
          <div className="lg:w-[58%] flex flex-col gap-4">
            {/* Main Image */}
            <div className="aspect-square rounded-2xl bg-white/[0.03] flex items-center justify-center overflow-hidden">
              <img
                src={activeImg}
                alt={product.name}
                className="w-full h-full object-contain p-6"
              />
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(img)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/[0.03] border transition
                      ${img === activeImg
                        ? 'border-sky-400/50'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={img} className="w-full h-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:w-[42%] flex flex-col gap-8 lg:sticky lg:top-10 lg:self-start">
            {/* Title */}
            <div>
              {product.brand && (
                <p className="text-xs text-sky-400 font-medium mb-1 tracking-wide">
                  {product.brand}
                </p>
              )}
              <h1 className="text-2xl font-semibold leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="relative">
              <div
  className={`text-3xl font-bold ${!loggedIn ? 'blur-md select-none' : ''}`}
>
  {loggedIn
    ? (Number(product.price) === 0 ? 'POA' : `£${Number(product.price).toLocaleString()}`)
    : '£•••'
  }
  
</div>
            </div>

            {/* Details */}
            <div className="rounded-2xl bg-white/[0.03] divide-y divide-white/[0.06] w-full">
              <Detail label="Condition" value={product.condition} />
              <Detail label="Size" value={product.size} />
              <Detail label="Type" value={product.productType} />
              {product.gender && <Detail label="Gender" value={product.gender} />}
              <Detail label="Vendor" value={product.vendorName} loggedIn={loggedIn} />
              {/* <Detail label="Ref" value={product.id.split('-')[0]} /> */}
            </div>

            {/* CTA */}
            <div className="flex justify-start">
              {loggedIn ? (
                <button
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full btn-blue text-sm font-medium leading-none whitespace-nowrap transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Message on WhatsApp
                </button>
              ) : (
                <button
                  onClick={onRequireAuth}
                  className="inline-flex items-center h-11 px-6 rounded-full btn-blue text-sm font-medium whitespace-nowrap"
                >
                  Sign up to message
                </button>
              )}
            </div>

            {/* Description */}
            {loggedIn && product.description && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </p>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, loggedIn = true }: { label: string; value?: string; loggedIn?: boolean }) {
  return (
    <div className="flex justify-between items-baseline px-5 py-3.5 gap-4">
      <span className="text-xs text-gray-500 uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span className={`text-sm text-gray-200 text-right break-words min-w-0 ${!loggedIn ? 'blur-md select-none' : ''}`}>
        {loggedIn ? value : '••••••'}
      </span>
    </div>
  )
}