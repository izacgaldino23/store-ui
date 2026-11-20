import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authApi } from '../api'
import { useAction } from '../hooks'
import { Field } from '../ui'

function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { run, busy, error, clearError } = useAction(async () => {
    if (isLogin) await authApi.login(email, password)
    else await authApi.register(email, username, password)
    navigate('/', { replace: true })
  })

  if (localStorage.getItem('access_token')) return <Navigate to="/" replace />

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isLogin ? 'Entrar' : 'Criar conta'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Acesse o PDV da Miau Store.' : 'Cadastre-se para usar o PDV.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!isLogin && (
              <Field label="Nome de usuário">
                <Input
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    clearError()
                  }}
                  autoComplete="username"
                  required
                  minLength={3}
                />
              </Field>
            )}
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  clearError()
                }}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Senha">
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  clearError()
                }}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
            </Field>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>
              {busy ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
            <Link
              to={isLogin ? '/register' : '/login'}
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              {isLogin ? 'Quero criar uma conta' : 'Já tenho conta'}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export function LoginScreen() {
  return <AuthScreen mode="login" />
}

export function RegisterScreen() {
  return <AuthScreen mode="register" />
}
