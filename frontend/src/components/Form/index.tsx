import React from 'react'

interface FormGroupProps {
  label: string
  children: React.ReactNode
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, children }) => {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

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