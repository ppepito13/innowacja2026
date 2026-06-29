interface RadioOption<T extends string> {
    value: T;
    label: string;
}

interface RadioGroupProps<T extends string> {
    label: string;
    value: T;
    options: RadioOption<T>[];
    onChange: (value: T) => void;
}

export default function RadioGroup<T extends string>({
                                                         label,
                                                         value,
                                                         options,
                                                         onChange,
                                                     }: RadioGroupProps<T>) {
    return (
        <div className="flex flex-col gap-1">
            <label className="block text-xs font-medium text-primary/70">{label}</label>
            <div className="flex gap-5">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer select-none"
                    >
                        <input
                            type="radio"
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                            className="accent-primary w-4 h-4"
                        />
                        <span className="text-sm text-primary">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
