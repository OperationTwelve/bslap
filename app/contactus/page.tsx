'use client'

import { useState, useEffect } from 'react'
import ContactForm from '@/components/ContactForm'
import ThankYou from '@/components/ThankYou'

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    // Scroll to the top of the page when the component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 mt-16">Contact Us</h1>
        {!isSubmitted ? (
          <ContactForm onSubmitSuccess={() => setIsSubmitted(true)} />
        ) : (
          <ThankYou />
        )}
      </div>
    </div>
  )
} 