import { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { LuSave, LuArrowLeft } from 'react-icons/lu';
import { Button, InputTextfieldStateful } from '@lsg/components';
import { parseService } from '../../services/parseService';
import { Registration, Event, FormConfig, FormConfigEntry } from '../../types/types';
import { formatColumnName } from '../../utils/formatters';
import { getFieldOptions, getOptionLabel, hasOptions } from '../../utils/formOptions';
import { useOptionAvailability, optionAvailability } from '../../hooks/useOptionAvailability';
import { useTranslation } from 'react-i18next';

import Icon from '../../components/Icon';

type RegistrationEditParams = {
  eventId: string;
  registrationId: string;
};

export default function RegistrationEdit() {
  const { t, i18n } = useTranslation();

  const { eventId, registrationId } = useParams<RegistrationEditParams>();
  const history = useHistory();

  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [limitOverride, setLimitOverride] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { availability } = useOptionAvailability(eventId);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      parseService.getById<Event>('TestEvent', eventId),
      parseService.getById<Registration>('Registration', registrationId),
    ])
      .then(([event, registration]) => {
        setEvent(event);
        setFormData(registration.formData ?? {});
        setLimitOverride(registration.limitOverride === true);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [eventId, registrationId]);

  const saveRegistration = async () => {
    setSaving(true);
    setError(null);

    parseService
      .update<Registration>('Registration', registrationId, { formData, limitOverride })
      .then(() => history.goBack())
      .catch((error) => {
        const serverMsg = error?.response?.data?.error || error?.message || 'Error';

        try {
          const parsed = JSON.parse(serverMsg);
          if (parsed?.code === 'OPTION_FULL') {
            setError(t('registrationEdit.errors.optionFull'));
            return;
          }
        } catch {
          // nie JSON
        }

        setError(serverMsg);
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <p className="p-8 text-primary/60">{t('registrationEdit.loading')}...</p>;
  }

  const fields = Object.entries((event?.formConfig ?? {}) as FormConfig);
  const hasLimitedFields = fields.some(([fieldKey]) => Boolean(availability[fieldKey]));

  return (
    <div className="flex flex-col bg-surface px-4 sm:px-8 py-4 rounded-2xl w-full max-w-lg">
      {/* HEADER */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl mb-0">{t('registrationEdit.title')}</h1>
          <p className="text-lg mt-0 text-primary/75">
            {event?.title ?? eventId} #{registrationId}
          </p>
        </div>

        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-primary/10 bg-surface p-2 text-primary transition hover:bg-background active:scale-95"
          onClick={() => history.goBack()}
        >
          <Icon icon={LuArrowLeft} />
        </button>
      </div>

      {error && <p className="text-sm text-error mb-0">{error}</p>}

      {/* FORM */}
      <div className="flex flex-col mt-4">
        {fields.map(([key, rawField]) => {
          const field = rawField as FormConfigEntry;

          // Pola z opcjami MUSZĄ być selectem — wpisanie dowolnego tekstu
          // zapisałoby wartość, która nie odpowiada żadnemu kluczowi opcji
          // i wypadłaby z liczenia limitów.
          if (hasOptions(field)) {
            return (
              <label key={key} className="flex flex-col gap-1 mb-4">
                <span className="text-xs font-bold text-primary">{formatColumnName(key)}</span>
                <select
                  value={String(formData[key] ?? '')}
                  onChange={(e) =>
                    setFormData((previousData) => ({ ...previousData, [key]: e.target.value }))
                  }
                  className="w-full box-border bg-surface-2 border border-primary/15 rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary/30"
                >
                  <option value="">—</option>
                  {getFieldOptions(field).map((option) => {
                    const stats = optionAvailability(availability, key, option.id);

                    return (
                      <option key={option.id} value={option.id}>
                        {getOptionLabel(option, i18n.language)}
                        {stats && ` (${stats.remaining}/${stats.limit})`}
                      </option>
                    );
                  })}
                </select>
              </label>
            );
          }

          return (
            <InputTextfieldStateful
              key={key}
              label={formatColumnName(key)}
              placeholder={formatColumnName(key)}
              defaultValue={String(formData[key] ?? '')}
              onChange={(value) =>
                setFormData((previousData) => ({ ...previousData, [key]: String(value) }))
              }
            />
          );
        })}

        {/* Override — tylko gdy w ogóle są jakieś limity do przekroczenia. */}
        {hasLimitedFields && (
          <label className="flex items-start gap-2 text-sm mt-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={limitOverride}
              onChange={(e) => setLimitOverride(e.target.checked)}
            />
            <span>
              <span className="font-medium text-primary">{t('registrations.overrideLabel')}</span>
              <span className="block text-xs text-primary/60">
                {t('registrations.overrideHint')}
              </span>
            </span>
          </label>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end mt-4 pb-4">
        <Button look="secondary" className="scale-75" onClick={() => history.goBack()}>
          {t('registrationEdit.cancel')}
        </Button>

        <Button className="scale-75" onClick={saveRegistration} disabled={saving}>
          <span className="flex flex-row items-center gap-2">
            <Icon icon={LuSave} />
            <span>
              {saving
                ? `${t('registrationEdit.save.pending')}...`
                : t('registrationEdit.save.idle')}
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}
