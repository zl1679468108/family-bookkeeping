import React from 'react'

interface FormRowProps {
  children: React.ReactNode
}

export const FormRow: React.FC<FormRowProps> = ({ children }) => {
  return (
    <div className="form-row">
      {children}
    </div>
  )
}