import './Toggle.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, id, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`toggle ${checked ? 'toggle-on' : ''}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}
