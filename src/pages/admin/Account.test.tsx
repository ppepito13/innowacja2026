import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Account from './Account';

const mockPush = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({ push: mockPush }),
}));

const mockLogout = jest.fn();

jest.mock('../../auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@lsg/components', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../../components/Icon', () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}));

jest.mock('react-icons/lu', () => ({
  LuLogOut: 'LuLogOut',
}));

describe('Account', () => {
  const { useAuth } = require('../../auth/AuthProvider');

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'admin', email: 'admin@example.com', role: 'Admin' },
      loading: false,
      logout: mockLogout,
    });
  });

  it('Renders properly', () => {
    const { asFragment } = render(<Account />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('Shows loading state', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({ user: null, loading: true, logout: mockLogout });
    render(<Account />);
    expect(screen.getByText(/account.loading/)).toBeInTheDocument();
  });

  it('Displays user data', () => {
    render(<Account />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('Calls logout and redirects to login', async () => {
    render(<Account />);
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});
