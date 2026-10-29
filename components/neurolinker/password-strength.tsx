import React from 'react'
import { checkPasswordStrength } from '@/lib/validation/password'

interface PasswordStrengthProps {
  password?: string
  senha?: string
}

export function PasswordStrengthMeter({ password, senha }: PasswordStrengthProps) {
  const currentPassword = password ?? senha ?? ''
  const { score, label, color } = checkPasswordStrength(currentPassword)

  const widthPercentage = currentPassword ? (score / 4) * 100 : 0

  return (
    <div className="w-full mt-2">
      <div className="flex justify-end mb-1">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
          {currentPassword ? label : ''}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
    </div>
  )
}

export { PasswordStrengthMeter as PasswordStrength }