/**
 * NumberPad — Virtual numeric keypad for mobile amount input.
 * Layout: 1-9 (3x3), . 0 backspace on bottom row, confirm button on side.
 */

import React from 'react';

interface NumberPadProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}

const keys: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

const NumberPad: React.FC<NumberPadProps> = ({
  onInput,
  onDelete,
  onConfirm,
  confirmDisabled = false,
}) => {
  return (
    <div className="flex gap-2">
      {/* Number grid */}
      <div className="flex-1 grid grid-cols-3 gap-2">
        {keys.map((row, rowIdx) =>
          row.map((key) => {
            const isBackspace = key === '⌫';
            return (
              <button
                key={`${rowIdx}-${key}`}
                onClick={() =>
                  isBackspace ? onDelete() : onInput(key)
                }
                className={`touch-target h-14 rounded-xl text-xl font-medium active:scale-95 transition-transform select-none ${
                  isBackspace
                    ? 'bg-gray-100 text-text-secondary'
                    : 'bg-white text-text shadow-sm border border-gray-100'
                }`}
              >
                {isBackspace ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                ) : (
                  key
                )}
              </button>
            );
          }),
        )}
      </div>

      {/* Confirm button (tall, right side) */}
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`w-16 rounded-xl text-white font-semibold text-sm active:scale-95 transition-transform select-none ${
          confirmDisabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-primary shadow-sm'
        }`}
        style={{ height: 'calc(4 * 3.5rem + 3 * 0.5rem)' }}
      >
        确{'\n'}认
      </button>
    </div>
  );
};

export default NumberPad;
