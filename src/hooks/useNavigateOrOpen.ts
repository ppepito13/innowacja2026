import { useHistory } from 'react-router';

export function useNavigateOrOpen() {
  const history = useHistory();

  return (path: string, e: React.MouseEvent<HTMLElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    history.push(path);
  };
}
