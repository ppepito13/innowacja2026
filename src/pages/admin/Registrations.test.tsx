import { render, screen, fireEvent } from '@testing-library/react';
import Registrations from './Registrations';

const mockPush = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({ push: mockPush }),
  useParams: () => ({ eventId: 'e123' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => (opts?.title ? `${key}:${opts.title}` : key),
  }),
}));

jest.mock('../../services/parseService', () => ({
  parseService: {
    getById: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
  },
  createPointer: (className: string, id: string) => ({
    __type: 'Pointer',
    className,
    objectId: id,
  }),
}));

jest.mock('../../utils/formatters', () => ({
  formatDate: (d: string) => d,
  formatColumnName: (key: string) => key,
  formatBoolean: (v: string) => v,
}));

jest.mock('@lsg/components', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  InputTextfieldStateful: ({ label, onChange }: any) => (
    <input aria-label={label} onChange={(e) => onChange(e.target.value)} />
  ),
  InputDatepicker: ({ label, onChange }: any) => (
    <input aria-label={label} type="date" onChange={(e) => onChange(e.target.value)} />
  ),
  ComplexTable: ({ columnProperties, tableBodyData }: any) => (
    <table>
      <thead>
        <tr>
          {columnProperties.map((c: any) => (
            <th key={c.name}>{c.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableBodyData.map((row: any) => (
          <tr key={row.rowId}>
            {row.rowData.map((cell: any, i: number) => (
              <td key={i}>
                {columnProperties[i]?.formatter ? columnProperties[i].formatter(cell) : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

jest.mock('react-icons/lu', () => ({
  LuCircleCheck: 'LuCircleCheck',
  LuChevronLeft: 'LuChevronLeft',
  LuChevronRight: 'LuChevronRight',
  LuDownload: 'LuDownload',
  LuEye: 'LuEye',
  LuEllipsis: 'LuEllipsis',
  LuPencil: 'LuPencil',
  LuX: 'LuX',
  LuCircleX: 'LuCircleX',
  LuClock: 'LuClock',
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

const mockRegistrations = [
  {
    objectId: 'r123',
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'approved',
    formData: { fullName: 'Alice', email: 'alice@example.com' },
  },
  {
    objectId: 'r456',
    createdAt: '2024-02-01T00:00:00.000Z',
    status: 'pending',
    formData: { fullName: 'Bob', email: 'bob@example.com' },
  },
];

describe('Registrations', () => {
  let mockGetById: jest.Mock;
  let mockQuery: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { parseService } = require('../../services/parseService');
    mockGetById = parseService.getById as jest.Mock;
    mockQuery = parseService.query as jest.Mock;
    mockUpdate = parseService.update as jest.Mock;
    mockUpdate.mockResolvedValue(undefined);
    mockGetById.mockResolvedValue(mockEvent);
    mockQuery.mockResolvedValue(mockRegistrations);
  });

  it('Renders properly', async () => {
    const { asFragment } = render(<Registrations />);
    await screen.findByText('Alice');
    expect(asFragment()).toMatchSnapshot();
  });

  it('Shows loading state', () => {
    mockGetById.mockReturnValue(new Promise(() => {}));
    mockQuery.mockReturnValue(new Promise(() => {}));
    render(<Registrations />);
    expect(screen.getByText(/registrations.loading/)).toBeInTheDocument();
  });

  it('Shows error on fetch failure', async () => {
    mockGetById.mockRejectedValue(new Error('Network error'));
    render(<Registrations />);
    await screen.findByText(/Network error/);
  });

  it('Renders table rows after loading', async () => {
    render(<Registrations />);
    await screen.findByText('Alice');
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('Shows empty state when no registrations', async () => {
    mockQuery.mockResolvedValue([]);
    render(<Registrations />);
    await screen.findByText('registrations.noRegistrations');
  });

  it('Filters by search term', async () => {
    render(<Registrations />);
    await screen.findByText('Alice');
    const searchInput = screen.getByRole('textbox', { name: /registrations.filters.search/i });
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('Export button disabled when no registrations', async () => {
    mockQuery.mockResolvedValue([]);
    render(<Registrations />);
    await screen.findByText('registrations.noRegistrations');
    const exportButton = screen.getByRole('button', { name: /registrations.export/i });
    expect(exportButton).toBeDisabled();
  });

  it('Export button enabled when registrations exist', async () => {
    render(<Registrations />);
    await screen.findByText('Alice');
    const exportButton = screen.getByRole('button', { name: /registrations.export/i });
    expect(exportButton).not.toBeDisabled();
  });

  it('Navigates to edit on edit click', async () => {
    render(<Registrations />);
    await screen.findByText('Alice');
    fireEvent.click(screen.getAllByRole('button', { name: 'LuPencil' })[0]);
    expect(mockPush).toHaveBeenCalledWith('/admin/registrations/e123/r123/edit');
  });

  it('Opens detail modal on view click', async () => {
    render(<Registrations />);
    await screen.findByText('Alice');
    fireEvent.click(screen.getAllByRole('button', { name: 'LuEye' })[0]);
    await screen.findByText('registrations.details.title');
  });

  it('Closes detail modal on close click', async () => {
    render(<Registrations />);
    await screen.findByText('Alice');
    fireEvent.click(screen.getAllByRole('button', { name: 'LuEye' })[0]);
    await screen.findByText('registrations.details.title');
    fireEvent.click(screen.getByRole('button', { name: 'LuX' }));
    expect(screen.queryByText('registrations.details.title')).not.toBeInTheDocument();
  });
});
