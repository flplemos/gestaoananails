import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Splash } from './components/ui'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import Ajustes from './pages/Ajustes'
import Clientes from './pages/Clientes'
import Despesas from './pages/Despesas'
import Faturamento from './pages/Faturamento'
import Hoje from './pages/Hoje'
import Login from './pages/Login'

function Gate() {
  const { ready, cloud, user } = useAuth()
  if (!ready) return <Splash />
  if (cloud && !user) return <Login />

  return (
    // key: troca de usuária recarrega todos os dados.
    <DataProvider key={user?.id ?? 'local'}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Hoje />} />
            <Route path="despesas" element={<Despesas />} />
            <Route path="faturamento" element={<Faturamento />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  )
}
