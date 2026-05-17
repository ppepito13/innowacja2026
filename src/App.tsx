import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
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
import Test from "./pages/Test";

function App() {
  return (
    <Router>
      <Switch>
        {/* Public Routes without default Layout (Landing Pages) */}
        <Route exact path="/events/:slug" component={EventDetails} />

        {/* Routes with default Layout */}
        <Route>
          <Layout>
            <Switch>
              {/* Admin Routes */}
              <Route exact path="/admin" component={Dashboard} />
              <Route exact path="/admin/events/new" component={EventNew} />
              <Route exact path="/admin/events/:id/edit" component={EventEdit} />
              <Route exact path="/admin/registrations" component={Registrations} />
              <Route exact path="/admin/registrations/:eventId/:registrationId/edit" component={RegistrationEdit} />
              <Route exact path="/admin/check-in" component={CheckIn} />
              <Route exact path="/admin/users" component={Users} />
              <Route exact path="/admin/users/new" component={UserNew} />
              <Route exact path="/admin/users/:id/edit" component={UserEdit} />
              <Route exact path="/admin/account" component={Account} />

              {/* Other Public Routes */}
              <Route exact path="/login" component={AdminLogin} />
              <Route exact path="/test" component={Test} />
              <Route exact path="/" component={Home} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
