import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLogin from './AdminLogin';

const mockPush = jest.fn();
jest.mock('react-router', () => ({
  useHistory: () => ({ push: mockPush }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockLogin = jest.fn();
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('@lsg/components', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  InputTextfieldStateful: ({ label, type, onChange }: any) => (
    <input aria-label={label} type={type ?? 'text'} onChange={(e) => onChange(e.target.value)} />
  ),
}));

jest.mock('../components/Icon', () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}));

describe('AdminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders properly', () => {
    const { asFragment } = render(<AdminLogin />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('Renders email and password fields', () => {
    render(<AdminLogin />);
    expect(screen.getByRole('textbox', { name: 'login.email' })).toBeInTheDocument();
    expect(screen.getByLabelText('login.password')).toBeInTheDocument();
  });

  it('Calls login with credentials on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<AdminLogin />);
    fireEvent.change(screen.getByRole('textbox', { name: 'login.email' }), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByLabelText('login.password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button'));
    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'secret');
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });

  it('Redirects to /admin on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<AdminLogin />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin'));
  });

  it('Shows error on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    render(<AdminLogin />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('login.error');
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });

  it('Disables button while loading', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<AdminLogin />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeDisabled();
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });

  it('Shows pending text while loading', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<AdminLogin />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/login.pending/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/login.pending/)).not.toBeInTheDocument());
  });
});
