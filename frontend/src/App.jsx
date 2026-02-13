import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Challenges from './pages/Challenges.jsx'
import Hulk from './hulk/Hulk.jsx'
import GammaWave from './hulk/GammaWave.jsx'
import HulkFinal from './hulk/HulkFinal.jsx'


const App = () => {
  return (
    <AuthProvider>
      <main className="relative min-h-screen w-screen overflow-x-hidden">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
          <Route
            path="/hulk"
            element={
              <ProtectedRoute>
                <Hulk />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gamma_wave"
            element={
              <ProtectedRoute>
                <GammaWave />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hulk_final"
            element={
              <ProtectedRoute>
                <HulkFinal />
              </ProtectedRoute>
            }
          />

        </Routes>
      </main>
    </AuthProvider>
  )
}

export default App