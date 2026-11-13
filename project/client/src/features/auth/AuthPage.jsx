import { useState } from 'react'
import { Boxes, Eye, EyeOff } from 'lucide-react'

function AuthPage({ initialError, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const isRegistering = mode === 'register'

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      if (isRegistering) {
        await onRegister({ name, email, password })
        setPassword('')
        setMode('login')
        setMessage('Account created. Sign in to continue.')
      } else {
        await onLogin({ email, password })
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <section aria-labelledby="auth-title" className="auth-card">
        <div className="auth-brand">
          <span className="brand__mark"><Boxes aria-hidden="true" size={19} strokeWidth={1.7} /></span>
          <span className="brand__name">Stockroom</span>
        </div>
        <p className="eyebrow">Inventory workspace</p>
        <h1 id="auth-title">{isRegistering ? 'Create your account' : 'Sign in to Stockroom'}</h1>
        <p className="auth-description">
          {isRegistering
            ? 'New accounts start with warehouse staff access'
            : 'Use your workspace account to manage inventory'}
        </p>

        {(initialError || error) && <p className="form-error auth-message" role="alert">{error || initialError}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Name
              <input
                autoComplete="name"
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          )}
          <label>
            Email
            <input
              autoComplete="email"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <span className="auth-password-field">
              <input
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                maxLength={72}
                minLength={isRegistering ? 12 : 1}
                onChange={(event) => setPassword(event.target.value)}
                required
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                className="icon-button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                type="button"
              >
                {isPasswordVisible
                  ? <EyeOff aria-hidden="true" size={17} />
                  : <Eye aria-hidden="true" size={17} />}
              </button>
            </span>
          </label>
          {isRegistering && (
            <p className="auth-hint">Use at least 12 characters. Registration cannot grant administrator access.</p>
          )}
          <button className="button button--primary auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Please wait' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegistering ? 'Already have an account?' : 'New to this workspace?'}
          {' '}
          <button
            className="text-button"
            onClick={() => changeMode(isRegistering ? 'login' : 'register')}
            type="button"
          >
            {isRegistering ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
