import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles.css'
import App from './App.jsx'
import Tickets from './pages/Tickets.jsx'
import AuthPage from './pages/Auth.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import ProfilePage from './pages/Profile.jsx'
import OrganizerDashboard from './pages/OrganizerDashboard.jsx'

import SavedPage from './pages/Saved.jsx'
import CreateEventPage from './pages/CreateEvent.jsx'
import EventPage from './pages/EventPage.jsx'
import BrowseEvents from './pages/BrowseEvents.jsx'
import ManageEvents from './pages/ManageEvents.jsx'
import EditEvent from './pages/EditEvent.jsx'
import CopyEvent from './pages/CopyEvent.jsx'
import Scanner from './pages/Scanner.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/organizer" element={<OrganizerDashboard />} />

            <Route path="/saved" element={<SavedPage />} />
            <Route path="/create" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventPage />} />
            <Route path="/browse-events" element={<BrowseEvents />} />
            <Route path="/manage-events" element={<ManageEvents />} />
            <Route path="/edit-event" element={<EditEvent />} />
            <Route path="/copy-event" element={<CopyEvent />} />
            <Route path="/scan" element={<Scanner />} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  </React.StrictMode>
)
