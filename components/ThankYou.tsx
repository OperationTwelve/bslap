'use client'

import { motion } from 'framer-motion'

export default function ThankYou() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-8"
      >
        Your message has been received
      </motion.h2>
      <div className="relative">
        <motion.div
          initial={{ scale: 1, rotate: 0, y: 0 }}
          animate={{
            scale: 0,
            rotate: 720,
            y: 300,
          }}
          transition={{
            duration: 1.5,
            ease: "easeIn"
          }}
          className="w-64 h-64 bg-white rounded-lg shadow-lg flex items-center justify-center"
        >
          <div className="text-center p-4">
            Thank you for your message!
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-[-100px] left-1/2 transform -translate-x-1/2"
        >
          <div className="w-20 h-24 bg-gray-800 rounded-t-none rounded-b-lg relative">
            {/* Trash can lid */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-gray-700 rounded"></div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 