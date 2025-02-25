import workflow from './BSLAPAPI6.json'

const API_HOST = 'https://bslapnft.app'
const DEBUG_MODE = true

interface GenerateImageParams {
  firstName: string
  lastName: string
  image: File
  awardType: string
}

// Debug logger helper
function logDebug(message: string) {
  if (DEBUG_MODE) console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`)
}

function generateOutputFilename(awardType: string, firstName: string, lastName: string, seed: number) {
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9-_]/g, '')
  return `${sanitize(awardType)}-${sanitize(firstName)}-${sanitize(lastName)}-${seed}`
}

export async function generateImage({
  firstName,
  lastName,
  image,
  awardType,
}: GenerateImageParams) {
  try {
    // 1. Get seed
    const seedUrl = `${API_HOST}/get_seed/${encodeURIComponent(awardType)}?t=${Date.now()}`
    logDebug(`Fetching seed from: ${seedUrl}`)
    
    const seedResponse = await fetch(seedUrl)
    if (!seedResponse.ok) {
      const errorText = await seedResponse.text()
      throw new Error(`Server error: ${seedResponse.status} - ${errorText}`)
    }
    
    const seedData = await seedResponse.json()
    const currentSeed = seedData.seed
    logDebug(`Retrieved seed: ${currentSeed} for ${awardType}`)

    // 2. Upload image
    logDebug(`Uploading image: ${image.name}`)
    const formData = new FormData()
    formData.append("image", image)

    const uploadResponse = await fetch(`${API_HOST}/upload/image`, {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error('Upload failed')
    }
    
    const uploadData = await uploadResponse.json()
    const uploadedFilename = uploadData.name
    logDebug(`Image uploaded successfully: ${uploadedFilename}`)

    // 3. Setup workflow
    const workflowData = JSON.parse(JSON.stringify(workflow))
    workflowData["419"]["inputs"]["text"] = awardType
    workflowData["523"]["inputs"]["seed"] = currentSeed
    workflowData["575"]["inputs"]["text"] = firstName
    workflowData["578"]["inputs"]["text"] = lastName
    workflowData["708"]["inputs"]["image"] = uploadedFilename

    // Set output filename
    const outputFilename = generateOutputFilename(awardType, firstName, lastName, currentSeed)
    workflowData["365"]["inputs"]["filename_prefix"] = outputFilename
    logDebug(`Output filename set to: ${outputFilename}`)

    // 4. Start processing
    const response = await fetch(`${API_HOST}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflowData })
    })

    if (!response.ok) {
      const errorDetail = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorDetail}`)
    }

    const data = await response.json()
    if (!data.prompt_id) {
      throw new Error('No prompt ID received')
    }

    logDebug(`Prompt ID received: ${data.prompt_id}`)

    // 5. Wait for image generation
    const imageUrl = await checkImageAvailability(outputFilename)
    
    // 6. Confirm seed
    const confirmResponse = await fetch(
      `${API_HOST}/confirm_seed/${encodeURIComponent(awardType)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: currentSeed })
      }
    )

    if (!confirmResponse.ok) {
      const errorDetail = await confirmResponse.text()
      throw new Error(`Seed confirmation failed: ${errorDetail}`)
    }

    return imageUrl

  } catch (error) {
    console.error('Generation failed:', error)
    throw error
  }
}

async function checkImageAvailability(outputFilename: string): Promise<string> {
  const MAX_ATTEMPTS = 30
  const RETRY_DELAY = 5000
  const imageUrl = `${API_HOST}/api/view?filename=${outputFilename}_00001_.png`
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    logDebug(`Checking image availability (Attempt ${attempt})`)
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      if (response.ok) {
        logDebug('Image is available')
        return imageUrl
      }
    } catch (error: unknown) {
      logDebug(`Attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
  }
  
  throw new Error('Image not available after maximum attempts')
}
