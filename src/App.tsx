import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { ProjectList } from './pages/operator/ProjectList'
import { SubmissionHistory } from './pages/operator/SubmissionHistory'
import { SubmissionForm } from './pages/operator/SubmissionForm'
import { Dashboard } from './pages/reviewer/Dashboard'
import { SubmissionDetail } from './pages/reviewer/SubmissionDetail'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/operator"
            element={
              <ProtectedRoute role="operator">
                <ProjectList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/projects/:projectId"
            element={
              <ProtectedRoute role="operator">
                <SubmissionHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/projects/:projectId/new"
            element={
              <ProtectedRoute role="operator">
                <SubmissionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer"
            element={
              <ProtectedRoute role="reviewer">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/submissions/:submissionId"
            element={
              <ProtectedRoute role="reviewer">
                <SubmissionDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
