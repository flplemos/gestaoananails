import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Button, Field, inputClass } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email.trim(), password)
    if (err) {
      console.error(err)
      setError(
        {
          email_not_confirmed: 'E-mail ainda não confirmado. Confirme o usuário no painel do Supabase.',
          invalid_credentials: 'E-mail ou senha incorretos.',
          over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos.',
        }[err.code] ?? `Não foi possível entrar (${err.message}).`,
      )
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center animate-fade-up">
        <div className="rounded-full bg-gradient-to-br from-primary to-primary-light p-1 shadow-fab">
          <img src="/logo.png" alt="Ana Nails" className="size-24 rounded-full bg-white p-2" />
        </div>
        <h1 className="mt-4 text-2xl text-primary">Ana Nails</h1>
        <p className="text-sm text-muted">Sua autoestima começa nas unhas ✨</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up">
        <Field label="E-mail">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Senha">
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error && <p className="text-center text-sm font-bold text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          <LogIn size={18} /> {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
