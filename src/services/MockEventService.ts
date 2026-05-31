import { Event } from '../types/types';
import {DEFAULT_PRIMARY_COLOR} from "../constants/eventDefaults";

export const getMockEvent = (): Event => {
  return {
    objectId: 'mock-id-123',
    description: `
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <ul>
        <li>test 1</li>
        <li>test 2</li>
        <li>test 3</li>
      </ul>
    `,
    startDate: {date: new Date()},
    isActive: true,
    formConfig: {},
    title: 'Innowacja 2026',
    location: 'Łódź, Poland',
    heroImageUrl: 'https://images.unsplash.com/photo-1682316953238-f1520b80618f?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    dateType: 'single',
    eventFormat: 'virtual',
    primaryColor: DEFAULT_PRIMARY_COLOR,
    accentColor: DEFAULT_PRIMARY_COLOR,
  };
};
