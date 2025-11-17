"use client"

import { motion, AnimatePresence } from "motion/react"

export default function StepIndicator({ step }: { step: number }) {
  const labels = ["Career", "College", "Interests", "Skills", "Review"]

  return (
    <aside className="mb-6 md:mb-0">
      <div className="flex flex-col items-start gap-10">
        {labels.map((label, i) => {
          const active = i + 1 === step
          return (
            <div key={label} className="flex items-center justify-end w-44">
              <AnimatePresence>
                {active && (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 8, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="pr-2 w-24 text-right text-xl font-medium text-gray-900"
                  >
                    {label}
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold transition-colors duration-200 ${
                  active ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
                }`}
                aria-hidden={!active}
              >
                {i + 1}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
