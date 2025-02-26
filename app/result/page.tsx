'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { generateImage } from '@/app/workflows/comfyui/api'
import Image from 'next/image'

export default function Result() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get all parameters from URL
  const imageUrl = searchParams.get('image')
  const firstName = searchParams.get('firstName')
  const lastName = searchParams.get('lastName')
  const awardType = searchParams.get('awardType')

  const handleReroll = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get the image file from the current image URL
      const imageResponse = await fetch(imageUrl!)
      const imageBlob = await imageResponse.blob()
      const imageFile = new File([imageBlob], 'reroll.png', { type: 'image/png' })

      // Generate new image with same parameters
      const newImageUrl = await generateImage({
        firstName: firstName!,
        lastName: lastName!,
        image: imageFile,
        awardType: awardType!,
      })

      // Update URL with new image while keeping other parameters
      const params = new URLSearchParams(searchParams)
      params.set('image', newImageUrl)
      router.replace(`/result?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reroll image')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    setIsLoading(true)
    // NFT minting will be added later
  }

  if (!imageUrl) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">No image found. Please try generating again.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Your Generated Award</h1>
        
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg shadow-lg">
          <Image
            src={imageUrl}
            alt="Generated Award"
            layout="fill"
            objectFit="contain"
            className="bg-black/5"
          />
        </div>

        {error && (
          <p className="text-red-500 text-center">{error}</p>
        )}

        <div className="flex justify-center gap-4">
          <Button 
            onClick={handleReroll}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Processing...' : 'Reroll'}
          </Button>
          
          <Button 
            onClick={handleClaim}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Claim NFT'}
          </Button>
        </div>
      </div>
    </div>
  )
} 