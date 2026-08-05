import React from 'react';

interface ColorFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export default function ColorField({ label, value, onChange }: ColorFieldProps) {
    const safeHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (/^#[0-9a-fA-F]{0,6}$/.test(raw)) {
            onChange(raw);
        }
    };

    return (
        <div className="flex flex-col gap-1 flex-1">
            <label className="block text-xs font-book text-primary/70 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={safeHex}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-primary/20 p-0.5 bg-surface"
                />
                <input
                    type="text"
                    value={value}
                    maxLength={7}
                    onChange={handleTextChange}
                    className="flex-1 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono text-primary focus:outline-none focus:border-primary/60"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}
