import type { FieldType, FieldTypeOption } from "../../types/types";

export const FIELD_TYPES: FieldTypeOption[] = [
  { value: "text", labelKey: "formConfig.fieldType.text", icon: "Aa" },
  { value: "email", labelKey: "formConfig.fieldType.email", icon: "@" },
  { value: "phone", labelKey: "formConfig.fieldType.phone", icon: "☎" },
  { value: "textarea", labelKey: "formConfig.fieldType.textarea", icon: "¶" },
  { value: "checkbox", labelKey: "formConfig.fieldType.checkbox", icon: "☑" },
  { value: "radio", labelKey: "formConfig.fieldType.radio", icon: "◉" },
  { value: "multiselect", labelKey: "formConfig.fieldType.multiselect", icon: "☑☑" },
  { value: "dropdown", labelKey: "formConfig.fieldType.dropdown", icon: "▾" },
];

export const TYPES_WITH_OPTIONS: FieldType[] = ["radio", "multiselect", "dropdown"];
