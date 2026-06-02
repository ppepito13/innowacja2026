import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';

import Layout from './components/Layout';

// Public pages
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import AdminLogin from './pages/AdminLogin';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import EventNew from './pages/admin/EventNew';
import EventEdit from './pages/admin/EventEdit';
import Registrations from './pages/admin/Registrations';
import RegistrationEdit from './pages/admin/RegistrationEdit';
import CheckIn from './pages/admin/CheckIn';
import Users from './pages/admin/Users';
import UserNew from './pages/admin/UserNew';
import UserEdit from './pages/admin/UserEdit';
import Account from './pages/admin/Account';

// Test page
import Test from './pages/Test';
import FormConfig from './pages/FormConfig';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          {/* Public Fullscreen Routes */}
          <Route exact path="/events/:eventId" component={EventDetails} />

          {/* Routes with Layout */}
          <Route>
            <Layout>
              <Switch>
                {/* Admin Routes */}
                <ProtectedRoute exact path="/admin" component={Dashboard} requiredRole="Admin" />
                <ProtectedRoute
                  exact
                  path="/admin/events/new"
                  component={EventNew}
                  requiredRole="Admin"
                />
                <ProtectedRoute
                  exact
                  path="/admin/events/:id/edit"
                  component={EventEdit}
                  requiredRole="Admin"
                />
                <ProtectedRoute
                  exact
                  path="/admin/registrations/:eventId"
                  component={Registrations}
                  requiredRole="Admin"
                />
                <ProtectedRoute
                  exact
                  path="/admin/registrations/:eventId/:registrationId/edit"
                  component={RegistrationEdit}
                  requiredRole="Admin"
                />
                <ProtectedRoute
                  exact
                  path="/admin/check-in"
                  component={CheckIn}
                  requiredRole="Admin"
                />
                <ProtectedRoute exact path="/admin/users" component={Users} requiredRole="Admin" />
                <ProtectedRoute
                  exact
                  path="/admin/users/new"
                  component={UserNew}
                  requiredRole="Admin"
                />
                <ProtectedRoute
                  exact
                  path="/admin/users/:id/edit"
                  component={UserEdit}
                  requiredRole="Admin"
                />
                <ProtectedRoute
                  exact
                  path="/admin/account"
                  component={Account}
                  requiredRole="Admin"
                />

                {/* Other Public Routes */}
                <Route exact path="/login" component={AdminLogin} />
                <Route exact path="/test" component={Test} />
                <Route exact path="/formconfig" component={FormConfig} />
                <Route exact path="/" component={Home} />
              </Switch>
            </Layout>
          </Route>
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;
