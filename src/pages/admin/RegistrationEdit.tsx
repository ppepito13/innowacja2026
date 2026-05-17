import { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { LuSave, LuArrowLeft } from 'react-icons/lu';
import { Button, InputTextfieldStateful } from '@lsg/components';
import { parseService } from '../../services/parseService';
import { Registration, Event } from '../../types/types';
import { formatColumnName } from '../../utils/formatters';

import Icon from '../../components/Icon';

type RegistrationEditParams = {
  eventId: string;
  registrationId: string;
};

export default function RegistrationEdit() {
  const { eventId, registrationId } = useParams<RegistrationEditParams>();
  const history = useHistory();

  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [eventId, registrationId]);

  const saveRegistration = async () => {
    setSaving(true);
    setError(null);

    parseService
      .update<Registration>('Registration', registrationId, { formData })
      .then(() => history.goBack())
      .catch((error) => setError(error.message))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <p className="p-8 text-primary/60">Loading data...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-600">Error: {error}</p>;
  }

  return (
    <div className="flex flex-col bg-white px-8 py-4 rounded-2xl w-[512px]">
      {/* HEADER */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl mb-0">Edit Registration</h1>
          <p className="text-lg mt-0 text-primary/75">
            {event?.title ?? eventId} #{registrationId}
          </p>
        </div>

        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-primary/10 bg-white p-2 text-primary transition hover:bg-background active:scale-95"
          onClick={() => history.goBack()}
        >
          <Icon icon={LuArrowLeft} />
        </button>
      </div>

      {/* FORM */}
      <div className="flex flex-col mt-4">
        {Object.entries(formData).map(([key, value]) => (
          <InputTextfieldStateful
            key={key}
            label={formatColumnName(key)}
            placeholder={formatColumnName(key)}
            defaultValue={String(value ?? '')}
            onChange={(value) =>
              setFormData((previousData) => ({ ...previousData, [key]: String(value) }))
            }
          />
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end mt-4 pb-4">
        <Button look="secondary" className="scale-75" onClick={() => history.goBack()}>
          Cancel
        </Button>

        <Button className="scale-75" onClick={saveRegistration} disabled={saving}>
          <span className="flex flex-row items-center gap-2">
            <Icon icon={LuSave} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
