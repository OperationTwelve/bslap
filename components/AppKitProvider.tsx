// components/AppKitProvider.tsx
'use client'

import { useEffect } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

let initialized = false

export function initializeAppKit() {
  if (initialized || typeof window === 'undefined') return
  
  try {
    // Set up Solana Adapter
    const solanaWeb3JsAdapter = new SolanaAdapter({
      wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
    })
    
    // Use your environment variable for the project ID
    const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID
    
    if (!projectId) {
      console.error('Missing NEXT_PUBLIC_REOWN_PROJECT_ID environment variable')
      return
    }
    
    // Metadata object
    const metadata = {
      name: 'BSlap Awards',
      description: 'Awards for BSlap',
      url: window.location.origin,
      icons: [window.location.origin + '/favicon.ico']
    }
    
    // Create AppKit
    createAppKit({
      adapters: [solanaWeb3JsAdapter],
      networks: [solana, solanaTestnet, solanaDevnet],
      metadata,
      projectId,
      features: {
        analytics: true
      }
    })
    
    initialized = true
    console.log('AppKit initialized successfully')
  } catch (error) {
    console.error('Error initializing AppKit:', error)
  }
}

export default function AppKitProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeAppKit()
  }, [])

  return <>{children}</>
}