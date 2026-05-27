import { render, screen } from '@testing-library/react';
import EventDetails from './EventDetails';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ eventId: 'event123' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockEvent = {
  objectId: 'event123',
  title: 'Tech Conference 2024',
  date: '2024-06-15',
  location: 'Warsaw, Poland',
  heroImageUrl: 'https://example.com/hero.jpg',
  descriptionHtml: '<p>An amazing tech event.</p>',
  brandingHexColor: '#ff6600',
  formConfig: {},
};

jest.mock('../services/MockEventService', () => ({
  getMockEvent: () => mockEvent,
}));

jest.mock('../assets/calendar-icon.svg', () => ({
  ReactComponent: () => <svg data-testid="calendar-icon" />,
}));

jest.mock('../assets/location-icon.svg', () => ({
  ReactComponent: () => <svg data-testid="location-icon" />,
}));

jest.mock('../assets/chevron-down-icon.svg', () => ({
  ReactComponent: () => <svg data-testid="chevron-down-icon" />,
}));

describe('EventDetails', () => {
  it('Renders properly', () => {
    const { asFragment } = render(<EventDetails />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('Renders event title', () => {
    render(<EventDetails />);
    expect(screen.getByText('Tech Conference 2024')).toBeInTheDocument();
  });

  it('Renders event date and location', () => {
    render(<EventDetails />);
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
    expect(screen.getByText('Warsaw, Poland')).toBeInTheDocument();
  });

  it('Renders event description HTML', () => {
    render(<EventDetails />);
    expect(screen.getByText('An amazing tech event.')).toBeInTheDocument();
  });

  it('Renders hero image with correct src', () => {
    render(<EventDetails />);
    const img = screen.getByRole('img', { name: 'Tech Conference 2024' });
    expect(img).toHaveAttribute('src', 'https://example.com/hero.jpg');
  });

  it('Renders registration form fields', () => {
    render(<EventDetails />);
    expect(screen.getByLabelText(/eventDetails.fullName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/eventDetails.email/i)).toBeInTheDocument();
  });

  it('Applies branding color to register button', () => {
    render(<EventDetails />);
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ backgroundColor: '#ff6600' });
  });

  it('Renders register button with correct text', () => {
    render(<EventDetails />);
    expect(screen.getByRole('button', { name: 'eventDetails.register' })).toBeInTheDocument();
  });
});
