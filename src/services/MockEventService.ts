import { Event } from '../types/Event';

export const getMockEvent = (): Event => {
  return {
    id: 'innowacja2026',
    title: 'Innowacja 2026',
    date: '16-17 maj 2026',
    location: 'Łódź, Poland',
    descriptionHtml: `
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <ul>
        <li>test 1</li>
        <li>test 2</li>
        <li>test 3</li>
      </ul>
    `,
    brandingHexColor: '#6366f1',
    heroImageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=2000',
  };
};
