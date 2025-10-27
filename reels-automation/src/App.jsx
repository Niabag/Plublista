import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CreateWizard from './pages/CreateWizard'
import Library from './pages/Library'
import Settings from './pages/Settings'
import JobDetails from './pages/JobDetails'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateWizard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/job/:id" element={<JobDetails />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
