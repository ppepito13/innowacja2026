import { render, screen, fireEvent, act } from '@testing-library/react';
import FormConfig from './FormConfig';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

jest.mock('../components/formConfig', () => ({
  FieldCard: ({ field, index, onUpdate, onRemove, error }: any) => (
    <div data-testid={`field-card-${index}`}>
      <input
        aria-label="label-input"
        value={field.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <button onClick={onRemove}>remove</button>
      {error && <span data-testid="error">{error}</span>}
    </div>
  ),
  TYPES_WITH_OPTIONS: ['radio', 'multiselect', 'dropdown'],
}));

describe('FormConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders with one field by default', () => {
    render(<FormConfig />);
    expect(screen.getAllByTestId(/field-card-/)).toHaveLength(1);
  });

  it('Adds a new field on add button click', () => {
    render(<FormConfig />);
    fireEvent.click(screen.getByText('formConfig.addField'));
    expect(screen.getAllByTestId(/field-card-/)).toHaveLength(2);
  });

  it('Removes a field on remove click', () => {
    render(<FormConfig />);
    fireEvent.click(screen.getByText('formConfig.addField'));
    expect(screen.getAllByTestId(/field-card-/)).toHaveLength(2);
    fireEvent.click(screen.getAllByText('remove')[0]);
    expect(screen.getAllByTestId(/field-card-/)).toHaveLength(1);
  });

  it('Toggles JSON preview visibility', () => {
    render(<FormConfig />);
    expect(screen.queryByText('formConfig.hideJson')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('formConfig.showJson'));
    expect(screen.getByText('formConfig.hideJson')).toBeInTheDocument();
  });

  it('Shows saved state after valid save then resets', async () => {
    jest.useFakeTimers();
    render(<FormConfig />);
    fireEvent.change(screen.getByLabelText('label-input'), { target: { value: 'Name' } });
    fireEvent.click(screen.getByText('formConfig.save'));
    expect(screen.getByText(/formConfig.saved/)).toBeInTheDocument();
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.getByText('formConfig.save')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('Shows validation error banner when label is empty', () => {
    render(<FormConfig />);
    fireEvent.click(screen.getByText('formConfig.save'));
    expect(screen.getByText(/formConfig\.errors\.validationFailed/)).toBeInTheDocument();
  });

  it('Shows duplicate label error on save', () => {
    render(<FormConfig />);
    fireEvent.change(screen.getByLabelText('label-input'), { target: { value: 'Name' } });
    fireEvent.click(screen.getByText('formConfig.addField'));
    fireEvent.change(screen.getAllByLabelText('label-input')[1], { target: { value: 'Name' } });
    fireEvent.click(screen.getByText('formConfig.save'));
    expect(screen.getByText(/formConfig\.errors\.validationFailed/)).toBeInTheDocument();
  });

  it('Clears validation banner after fixing errors', () => {
    render(<FormConfig />);
    fireEvent.click(screen.getByText('formConfig.save'));
    expect(screen.getByText(/formConfig\.errors\.validationFailed/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('label-input'), { target: { value: 'Fixed' } });
    fireEvent.click(screen.getByText('formConfig.save'));
    expect(screen.queryByText(/formConfig\.errors\.validationFailed/)).not.toBeInTheDocument();
  });

  it('JSON preview reflects current field labels', () => {
    render(<FormConfig />);
    fireEvent.change(screen.getByLabelText('label-input'), { target: { value: 'Email' } });
    fireEvent.click(screen.getByText('formConfig.showJson'));
    expect(screen.getByText(/email/)).toBeInTheDocument();
  });
});
