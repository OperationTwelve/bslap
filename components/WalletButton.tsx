// components/SimpleWalletButton.tsx
'use client'

import React from 'react'

export default function SimpleWalletButton() {
  return (
    <>
      {/* @ts-expect-error Suppressing TypeScript errors for React 19 global components */}
      <appkit-button />
    </>
  )
}