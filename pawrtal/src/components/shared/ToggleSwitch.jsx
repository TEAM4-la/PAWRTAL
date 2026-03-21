import { useState } from 'react';

export default function ToggleSwitch({ defaultOn = false, onChange }) {
  const [isOn, setIsOn] = useState(defaultOn);

  const toggle = () => {
    const next = !isOn;
    setIsOn(next);
    onChange?.(next);
  };

  return (
    <button
      onClick={toggle}
      className={`w-10 h-5 rounded-full transition-colors duration-300 ${isOn ? 'bg-green-400/70' : 'bg-red-400/70'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 mx-0.5 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}