interface ColorFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export default function ColorField({ label, value, onChange }: ColorFieldProps) {
    const safeHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';

    return (
        <div className="flex flex-col gap-1 flex-1">
            <label className="block text-xs font-medium text-primary/70 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={safeHex}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-primary/20 p-0.5 bg-white"
                />
                <input
                    type="text"
                    value={value}
                    maxLength={7}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('#')) val = '#' + val.replace('#', '');
                        if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onChange(val);
                    }}
                    className="flex-1 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono text-primary focus:outline-none focus:border-primary/60"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}
