import { render, screen } from '@testing-library/react';
import EventDetails from './EventDetails';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ eventId: 'event123' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../services/parseService', () => ({
  parseService: {
    getById: jest.fn(),
  },
}));

jest.mock('react-icons/lu', () => ({
  LuCalendarDays: 'LuCalendarDays',
  LuMapPin: 'LuMapPin',
  LuChevronDown: 'LuChevronDown',
}));

jest.mock('../components/Icon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span>{icon}</span>,
}));

const mockEvent = {
  objectId: 'event123',
  title: 'Tech Conference 2024',
  startDate: new Date('2024-06-15'),
  location: 'Warsaw, Poland',
  heroImageUrl: 'https://example.com/hero.jpg',
  description: '<p>An amazing tech event.</p>',
  primaryColor: '#ff6600',
  dateType: 'single' as const,
  eventFormat: 'on-site' as const,
  isActive: true,
  formConfig: {},
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('EventDetails', () => {
  let mockGetById: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const { parseService } = require('../services/parseService');

    mockGetById = parseService.getById as jest.Mock;

    mockGetById.mockResolvedValue(mockEvent);
  });

  it('Renders properly', async () => {
    const { asFragment } = render(<EventDetails />);

    await screen.findByText('Tech Conference 2024');

    expect(asFragment()).toMatchSnapshot();
  });

  it('Renders event title', async () => {
    render(<EventDetails />);

    expect(await screen.findByText('Tech Conference 2024')).toBeInTheDocument();
  });

  it('Renders event date and location', async () => {
    render(<EventDetails />);

    expect(await screen.findByText('6/15/2024')).toBeInTheDocument();

    expect(await screen.findByText('Warsaw, Poland')).toBeInTheDocument();
  });

  it('Renders event description HTML', async () => {
    render(<EventDetails />);

    expect(await screen.findByText('An amazing tech event.')).toBeInTheDocument();
  });

  it('Renders hero image with correct src', async () => {
    render(<EventDetails />);

    const img = await screen.findByRole('img', {
      name: 'Tech Conference 2024',
    });

    expect(img).toHaveAttribute('src', 'https://example.com/hero.jpg');
  });

  it('Renders registration form fields', async () => {
    render(<EventDetails />);

    expect(await screen.findByLabelText(/eventDetails.fullName/i)).toBeInTheDocument();

    expect(await screen.findByLabelText(/eventDetails.email/i)).toBeInTheDocument();
  });

  it('Applies branding color to register button', async () => {
    render(<EventDetails />);

    const button = await screen.findByRole('button', {
      name: 'eventDetails.register',
    });

    expect(button).toHaveStyle({
      backgroundColor: '#ff6600',
    });
  });

  it('Renders register button with correct text', async () => {
    render(<EventDetails />);

    expect(
      await screen.findByRole('button', {
        name: 'eventDetails.register',
      }),
    ).toBeInTheDocument();
  });
});
