import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ForensicDashboard from './pages/ForensicDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ForensicDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App