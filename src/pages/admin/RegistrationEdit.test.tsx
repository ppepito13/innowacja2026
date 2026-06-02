import { render, screen, fireEvent } from '@testing-library/react';
import RegistrationEdit from './RegistrationEdit';

const mockGoBack = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({ goBack: mockGoBack }),
  useParams: () => ({ eventId: 'e123', registrationId: 'r456' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/parseService', () => ({
  parseService: {
    getById: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/formatters', () => ({
  formatColumnName: (key: string) => key,
}));

jest.mock('@lsg/components', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  InputTextfieldStateful: ({ label, defaultValue, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input
        defaultValue={defaultValue}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${label}`}
      />
    </div>
  ),
}));

jest.mock('react-icons/lu', () => ({
  LuArrowLeft: 'LuArrowLeft',
  LuSave: 'LuSave',
}));

jest.mock('../../components/Icon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span>{icon}</span>,
}));

const mockEvent = {
  objectId: 'e123',
  title: 'Test Event',
  formConfig: { fullName: {}, email: {} },
};

const mockRegistration = {
  objectId: 'r456',
  formData: { fullName: 'John Doe', email: 'john@example.com' },
  status: 'pending',
};

describe('RegistrationEdit', () => {
  let mockGetById: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { parseService } = require('../../services/parseService');
    mockGetById = parseService.getById as jest.Mock;
    mockUpdate = parseService.update as jest.Mock;
    mockUpdate.mockResolvedValue(undefined);
    mockGetById.mockImplementation((className: string) => {
      if (className === 'TestEvent') return Promise.resolve(mockEvent);
      if (className === 'Registration') return Promise.resolve(mockRegistration);
      return Promise.reject(new Error('Unknown class'));
    });
  });

  it('Renders properly', async () => {
    const { asFragment } = render(<RegistrationEdit />);
    await screen.findByTestId('input-fullName');
    expect(asFragment()).toMatchSnapshot();
  });

  it('Shows loading state', () => {
    mockGetById.mockReturnValue(new Promise(() => {}));
    render(<RegistrationEdit />);
    expect(screen.getByText(/registrationEdit.loading/)).toBeInTheDocument();
  });

  it('Shows error on fail', async () => {
    mockGetById.mockRejectedValue(new Error('Fetch failed'));
    render(<RegistrationEdit />);
    await screen.findByText(/Fetch failed/);
  });

  it('Renders form fields after reload', async () => {
    render(<RegistrationEdit />);
    await screen.findByTestId('input-fullName');
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
  });

  it('Calls update and goBack on save', async () => {
    render(<RegistrationEdit />);
    await screen.findByTestId('input-fullName');
    fireEvent.click(screen.getByRole('button', { name: /registrationEdit.save.idle/i }));
    await screen.findByTestId('input-fullName');
    expect(mockUpdate).toHaveBeenCalledWith('Registration', 'r456', expect.any(Object));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('Calls goBack on cancel', async () => {
    render(<RegistrationEdit />);
    await screen.findByTestId('input-fullName');
    fireEvent.click(screen.getByText('registrationEdit.cancel'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('Calls goBack on arrowBack click', async () => {
    render(<RegistrationEdit />);
    await screen.findByTestId('input-fullName');
    fireEvent.click(screen.getByRole('button', { name: 'LuArrowLeft' }));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
