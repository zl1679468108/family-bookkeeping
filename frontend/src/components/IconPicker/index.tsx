import React from 'react';
import './index.scss';

export interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  icons: string[];
  label?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  icons,
  label = '图标',
}) => {
  return (
    <div className="icon-grid">
      {icons.map((icon) => (
        <button
          key={icon}
          className={`icon-btn ${value === icon ? 'active' : ''}`}
          onClick={() => onChange(icon)}
          type="button"
        >
          <span className="icon-btn-emoji">{icon}</span>
        </button>
      ))}
    </div>
  );
};
