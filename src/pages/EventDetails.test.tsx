import { render, screen } from '@testing-library/react';
import EventDetails from './EventDetails';
import { MongoDate } from '../types/types';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ eventId: 'event123' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

jest.mock('../utils/formatters', () => ({
  formatColumnName: (key: string) => key,
  formatDate: (date: string) =>
    new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(date),
    ),
}));

jest.mock('../services/parseService', () => ({
  parseService: {
    getById: jest.fn(),
  },
  createPointer: jest.fn(),
}));

jest.mock('react-icons/lu', () => ({
  LuCalendarDays: 'LuCalendarDays',
  LuMapPin: 'LuMapPin',
  LuChevronDown: 'LuChevronDown',
  LuLoaderCircle: 'LuLoaderCircle',
}));

jest.mock('../components/Icon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span>{icon}</span>,
}));

const mockEvent = {
  objectId: 'event123',
  title: 'Tech Conference 2024',
  startDate: { iso: '2024-06-15T00:00:00.000Z', __type: 'Date' } as MongoDate,
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

    expect(await screen.findByText('15.06.2024, 02:00')).toBeInTheDocument();
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
});
