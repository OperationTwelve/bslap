'use client'

import { useState, useEffect } from 'react'
import { generateImage } from '@/app/workflows/comfyui/api'
import { useRouter } from 'next/navigation'
import * as faceapi from 'face-api.js'

export default function Generate() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    awardType: 'Dickhead',
    xProfileUrl: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageValidationError, setImageValidationError] = useState<string | null>(null)
  const [faceDetectionStatus, setFaceDetectionStatus] = useState<'idle' | 'checking' | 'detected' | 'not_detected' | 'error'>('idle')

  const awardOptions = ['Dickhead', 'option2', 'option3', 'option4', 'option5']

  // Load face detection model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
      } catch (err) {
        console.error('Failed to load face detection model', err)
      }
    }
    loadModel()
  }, [])

  // Handle file input change with validation and face detection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setImageValidationError('File size exceeds 10MB')
        setFaceDetectionStatus('idle')
        return
      }

      // Validate file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'webp']
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !allowedTypes.includes(extension)) {
        setImageValidationError('Only JPG, JPEG, PNG, and WEBP files are allowed')
        setFaceDetectionStatus('idle')
        return
      }

      // File is valid, proceed with face detection
      setImageFile(file)
      setImageValidationError(null)
      setFaceDetectionStatus('checking')
      detectFace(file)
    } else {
      setImageFile(null)
      setImageValidationError(null)
      setFaceDetectionStatus('idle')
    }
  }

  // Perform face detection on the uploaded file
  const detectFace = async (file: File) => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const img = new Image()
      img.src = dataUrl
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
      })

      const detections = await faceapi.detectAllFaces(img)
      setFaceDetectionStatus(detections.length > 0 ? 'detected' : 'not_detected')
    } catch (err) {
      console.error('Face detection error', err)
      setFaceDetectionStatus('error')
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (faceDetectionStatus !== 'detected') {
      setError('Please upload an image with a face')
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      if (!imageFile) {
        throw new Error('Please select an image')
      }

      const imageUrl = await generateImage({
        firstName: formData.firstName,
        lastName: formData.lastName,
        image: imageFile,
        awardType: formData.awardType,
      })

      const params = new URLSearchParams({
        image: imageUrl,
        firstName: formData.firstName,
        lastName: formData.lastName,
        awardType: formData.awardType,
        xProfileUrl: formData.xProfileUrl,
      })
      router.push(`/result?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create Your Award</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 bg-white p-8 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Upload Image
          </label>
          <input
            type="file"
            id="image"
            required
            accept="image/*"
            className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90"
            onChange={handleFileChange}
          />
          {imageValidationError && <p className="text-sm text-red-500">{imageValidationError}</p>}
          {faceDetectionStatus === 'checking' && <p className="text-sm text-gray-500">Checking for face...</p>}
          {faceDetectionStatus === 'detected' && <p className="text-sm text-green-500">Face detected</p>}
          {faceDetectionStatus === 'not_detected' && <p className="text-sm text-red-500">No face detected in the image</p>}
          {faceDetectionStatus === 'error' && <p className="text-sm text-red-500">Error during face detection</p>}
        </div>

        <div>
          <label htmlFor="awardType" className="block text-sm font-medium text-gray-700">
            Award Name
          </label>
          <select
            id="awardType"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            value={formData.awardType}
            onChange={(e) => setFormData({ ...formData, awardType: e.target.value })}
          >
            {awardOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="xProfileUrl" className="block text-sm font-medium text-gray-700">
            X Profile URL
          </label>
          <input
            type="url"
            id="xProfileUrl"
            required
            placeholder="https://x.com/username"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            value={formData.xProfileUrl}
            onChange={(e) => setFormData({ ...formData, xProfileUrl: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={
            isLoading ||
            !formData.firstName ||
            !formData.lastName ||
            !formData.xProfileUrl ||
            !imageFile ||
            imageValidationError !== null ||
            faceDetectionStatus !== 'detected'
          }
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Award'}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  )
}