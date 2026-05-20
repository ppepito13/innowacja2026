import { Redirect, Route, RouteProps } from 'react-router';
import { useAuth } from './AuthContext';
import { User } from '../types/types';

type Role = User['role'];

function ProtectedRoute({
  component: Component,
  requiredRole,
  ...rest
}: RouteProps & { component: React.ComponentType<any>; requiredRole?: Role | Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const validRole =
    !requiredRole ||
    (user &&
      (Array.isArray(requiredRole)
        ? requiredRole.includes(user.role)
        : user.role === requiredRole));

  return (
    <Route
      {...rest}
      render={(props) =>
        !user ? (
          <Redirect to="/login" />
        ) : !validRole ? (
          <Redirect to="/" />
        ) : (
          <Component {...props} />
        )
      }
    />
  );
}

export default ProtectedRoute;
