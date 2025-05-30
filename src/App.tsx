import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { useAuth } from './hooks/useAuth'
import { SearchProvider } from './contexts/SearchContext'
import { GeminiProvider } from './contexts/GeminiContext'

// Import your page components here
import { Landing } from './pages/Landing'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { Movies } from './pages/Movies'
import { Books } from './pages/Books'
import { TVShows } from './pages/TVShows'
import { TVShowDetail } from './pages/TVShowDetail'
import { AuthCallback } from './pages/AuthCallback'
import { Promptpage } from './pages/Promptpage'
import { MovieDetail } from './pages/MovieDetail'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'
import { Lists } from './pages/Lists'
import { BookDetails } from './pages/BookDetails'
import { BookDetail } from './pages/BookDetail'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const App = () => {
  const { isAuthenticated } = useAuth()

  return (
    <GeminiProvider
      apiKey={import.meta.env.VITE_GEMINI_API_KEY || ''}
      model="gemini-2.0-flash"
      temperature={0.7}
      maxOutputTokens={1024}
      retryAttempts={3}
      retryDelay={2000}
    >
      <SearchProvider>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/landing" /> : <Landing />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/landing" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute>
                  <Promptpage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/movies"
            element={
              <Layout>
                <ProtectedRoute>
                  <Movies />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/movie/:id"
            element={
              <Layout>
                <ProtectedRoute>
                  <MovieDetail />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/tv"
            element={
              <Layout>
                <ProtectedRoute>
                  <TVShows />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/tv/:id"
            element={
              <Layout>
                <ProtectedRoute>
                  <TVShowDetail />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/books"
            element={
              <Layout>
                <ProtectedRoute>
                  <Books />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/books/:id"
            element={
              <Layout>
                <ProtectedRoute>
                  <BookDetails />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/book/:id"
            element={
              <Layout>
                <ProtectedRoute>
                  <BookDetail />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/privacy-policy"
            element={
              <Layout>
                <PrivacyPolicy />
              </Layout>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <Layout>
                <TermsOfService />
              </Layout>
            }
          />
          <Route
            path="/lists"
            element={
              <Layout>
                <ProtectedRoute>
                  <Lists />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SearchProvider>
    </GeminiProvider>
  )
}
