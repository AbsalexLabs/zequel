'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { ZequelLogo } from '@/components/zequel-logo'
import { OtpVerify } from '@/components/otp-verify'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OUTPUT_FORMAT_LABELS } from '@/lib/types'
import type { OutputFormat, UserPreferences, Profile } from '@/lib/types'
import { ArrowLeft, Camera, User, Shield, Palette, FileOutput } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SettingsClientProps {
  userId: string
  userEmail: string
  preferences: UserPreferences | null
  profile: Profile | null
}

const CATEGORIES = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'output', label: 'Output', icon: FileOutput },
] as const

type Category = (typeof CATEGORIES)[number]['id']

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
const NAME_REGEX = /^[a-zA-Z0-9 ]*$/

export function SettingsClient({ userId, userEmail, preferences, profile }: SettingsClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeCategory, setActiveCategory] = useState<Category>('profile')

  // Profile state
  const [username, setUsername] = useState(profile?.username || '')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [usernameError, setUsernameError] = useState('')
  const [nameError, setNameError] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Password change state
  const [passwordStep, setPasswordStep] = useState<'idle' | 'otp_sent' | 'otp_verify' | 'new_password'>('idle')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Preferences state
  const [defaultFormat, setDefaultFormat] = useState<OutputFormat>(
    preferences?.default_output_format || 'summarize'
  )
  const [autoCitation, setAutoCitation] = useState(preferences?.auto_citation ?? true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const validateUsername = (value: string) => {
    if (value && !USERNAME_REGEX.test(value)) { setUsernameError('Only letters, numbers, and underscores'); return false }
    if (value && value.length < 3) { setUsernameError('Minimum 3 characters'); return false }
    setUsernameError('')
    return true
  }

  const validateName = (value: string) => {
    if (value && !NAME_REGEX.test(value)) { setNameError('No symbols allowed'); return false }
    setNameError('')
    return true
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return
    setIsUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`
      setAvatarUrl(newUrl)
      await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', userId)
    }
    setIsUploadingAvatar(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Change password flow: send OTP -> verify -> set new password
  const handleStartPasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    setIsSendingOtp(true)
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, purpose: 'change_password' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send code')
      setPasswordStep('otp_verify')
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handlePasswordOtpVerified = () => {
    setPasswordStep('new_password')
  }

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match'); return }
    setIsChangingPassword(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setPasswordSuccess('Password updated successfully')
      setPasswordStep('idle')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordSuccess(''), 4000)
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSave = async () => {
    const usernameValid = validateUsername(username)
    const nameValid = validateName(fullName)
    if (!usernameValid || !nameValid) return
    setIsSaving(true)
    setSaveMessage('')
    try {
      const supabase = createClient()
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: username || null, full_name: fullName || null })
        .eq('id', userId)
      
      if (profileError) {
        if (profileError.message.includes('duplicate') || profileError.message.includes('unique')) {
          setUsernameError('Username already taken')
          throw new Error('Username already taken')
        }
        if (profileError.message.includes('username_format')) {
          setUsernameError('Only letters, numbers, and underscores')
          throw profileError
        }
        if (profileError.message.includes('name_format')) {
          setNameError('No symbols allowed')
          throw profileError
        }
        throw profileError
      }

      // Update preferences
      const { error: prefError } = await supabase
        .from('preferences')
        .update({
          theme: theme as 'light' | 'dark',
          default_output_format: defaultFormat,
          auto_citation: autoCitation,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (prefError) throw prefError

      setIsSaving(false)
      setSaveMessage('Saved')
      setTimeout(() => setSaveMessage(''), 2000)
    } catch (err) {
      setIsSaving(false)
      console.error('[v0] Save error:', err)
      if (!usernameError && !nameError) {
        setSaveMessage('Error saving changes')
      }
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const displayInitials = (() => {
    const name = fullName || profile?.display_name || userEmail || 'U'
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  })()

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <Link href="/workspace">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <ZequelLogo />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">Settings</h1>

        {/* Category Navigation */}
        <div className="mt-6 flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory(id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-all',
                activeCategory === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="mt-8">
          {/* ========== PROFILE ========== */}
          {activeCategory === 'profile' && (
            <div className="flex flex-col gap-6">
              <SectionHeader title="Profile" description="Your public identity on Zequel." />

              {/* Live Preview */}
              <div className="rounded-lg border border-border bg-secondary/30 p-6">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Preview</p>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                    <AvatarFallback className="bg-background font-mono text-sm font-semibold text-foreground">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {fullName && <p className="font-sans text-sm font-semibold text-foreground">{fullName}</p>}
                    {username && (
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        @{username}
                      </p>
                    )}
                    {!fullName && !username && (
                      <p className="font-sans text-sm text-muted-foreground/50">No profile info set</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative shrink-0" disabled={isUploadingAvatar}>
                  <Avatar className="h-20 w-20">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                    <AvatarFallback className="bg-secondary font-mono text-base text-foreground">{displayInitials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 transition-colors group-hover:bg-foreground/10">
                    <Camera className="h-5 w-5 text-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {isUploadingAvatar ? 'Uploading...' : 'Click to change photo'}
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground/50">JPG, PNG. Max 2MB.</span>
                </div>
              </div>

              <Separator />

              {/* Username */}
              <FieldRow label="Username" error={usernameError}>
                <Input
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); validateUsername(e.target.value) }}
                  placeholder="your_username"
                  className="h-9 w-full max-w-xs rounded-md border-border bg-background font-mono text-sm text-foreground placeholder:text-muted-foreground/40"
                />
              </FieldRow>

              <Separator />

              {/* Full Name */}
              <FieldRow label="Name" error={nameError}>
                <Input
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); validateName(e.target.value) }}
                  placeholder="Your Name"
                  className="h-9 w-full max-w-xs rounded-md border-border bg-background font-sans text-sm text-foreground placeholder:text-muted-foreground/40"
                />
              </FieldRow>

              <Separator />

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={isSaving} className="h-9 rounded-md bg-foreground px-6 font-mono text-xs uppercase tracking-wider text-background hover:bg-foreground/90">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                {saveMessage && <span className="font-mono text-[11px] text-muted-foreground">{saveMessage}</span>}
              </div>
            </div>
          )}

          {/* ========== ACCOUNT ========== */}
          {activeCategory === 'account' && (
            <div className="flex flex-col gap-6">
              <SectionHeader title="Account" description="Manage your email, password, and session." />

              {/* Email */}
              <FieldRow label="Email">
                <span className="font-sans text-sm text-foreground">{userEmail}</span>
              </FieldRow>

              <Separator />

              {/* Change Password */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Password</p>
                    <p className="mt-0.5 font-sans text-[12px] text-muted-foreground/70">Change your account password via email verification.</p>
                  </div>
                  {passwordStep === 'idle' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartPasswordChange}
                      disabled={isSendingOtp}
                      className="h-8 rounded-md border-border font-mono text-[11px] uppercase tracking-wider"
                    >
                      {isSendingOtp ? 'Sending...' : 'Change'}
                    </Button>
                  )}
                </div>

                {passwordSuccess && (
                  <p className="rounded-md bg-secondary/50 px-3 py-2 font-mono text-[11px] text-foreground">{passwordSuccess}</p>
                )}

                {passwordStep === 'otp_verify' && (
                  <div className="rounded-lg border border-border bg-secondary/20 p-5">
                    <OtpVerify
                      email={userEmail}
                      purpose="change_password"
                      onVerified={handlePasswordOtpVerified}
                      onBack={() => { setPasswordStep('idle'); setPasswordError('') }}
                    />
                  </div>
                )}

                {passwordStep === 'new_password' && (
                  <form onSubmit={handleSetNewPassword} className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/20 p-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Set New Password</p>
                    <Input
                      type="password"
                      placeholder="New password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-9 rounded-md border-border bg-background font-sans text-sm text-foreground placeholder:text-muted-foreground/40"
                      autoComplete="new-password"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="h-9 rounded-md border-border bg-background font-sans text-sm text-foreground placeholder:text-muted-foreground/40"
                      autoComplete="new-password"
                    />
                    {passwordError && <p className="font-mono text-[10px] text-confidence-low">{passwordError}</p>}
                    <div className="flex items-center gap-2 pt-1">
                      <Button type="submit" disabled={isChangingPassword} className="h-8 rounded-md bg-foreground font-mono text-[11px] uppercase tracking-wider text-background hover:bg-foreground/90">
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => { setPasswordStep('idle'); setNewPassword(''); setConfirmNewPassword(''); setPasswordError('') }} className="h-8 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <Separator />

              {/* Sign Out */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Session</p>
                  <p className="mt-0.5 font-sans text-[12px] text-muted-foreground/70">Sign out of your current session.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut} className="h-8 rounded-md border-border font-mono text-[11px] uppercase tracking-wider text-foreground hover:bg-secondary">
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </div>
          )}

          {/* ========== THEME ========== */}
          {activeCategory === 'theme' && (
            <div className="flex flex-col gap-6">
              <SectionHeader title="Theme" description="Customize the look and feel of your workspace." />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Appearance</p>
                  <p className="mt-0.5 font-sans text-[12px] text-muted-foreground/70">Switch between light and dark mode.</p>
                </div>
                <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
                  {['light', 'dark'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={cn(
                        'rounded-md px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all',
                        theme === t
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={isSaving} className="h-9 rounded-md bg-foreground px-6 font-mono text-xs uppercase tracking-wider text-background hover:bg-foreground/90">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                {saveMessage && <span className="font-mono text-[11px] text-muted-foreground">{saveMessage}</span>}
              </div>
            </div>
          )}

          {/* ========== OUTPUT ========== */}
          {activeCategory === 'output' && (
            <div className="flex flex-col gap-6">
              <SectionHeader title="Output" description="Configure how Zequel generates and formats responses." />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Default Format</p>
                  <p className="mt-0.5 font-sans text-[12px] text-muted-foreground/70">Choose the default output format for new queries.</p>
                </div>
                <Select value={defaultFormat} onValueChange={(v) => setDefaultFormat(v as OutputFormat)}>
                  <SelectTrigger className="h-9 w-48 rounded-md border-border font-mono text-[11px] uppercase tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {Object.entries(OUTPUT_FORMAT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="font-mono text-[11px] uppercase tracking-wider">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Auto-Citation</p>
                  <p className="mt-0.5 font-sans text-[12px] text-muted-foreground/70">Automatically include source citations in output.</p>
                </div>
                <Switch checked={autoCitation} onCheckedChange={setAutoCitation} />
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={isSaving} className="h-9 rounded-md bg-foreground px-6 font-mono text-xs uppercase tracking-wider text-background hover:bg-foreground/90">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                {saveMessage && <span className="font-mono text-[11px] text-muted-foreground">{saveMessage}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">Absalex Labs</span>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-2">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      <p className="mt-1 font-sans text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {error && <span className="font-mono text-[10px] text-confidence-low">{error}</span>}
      </div>
      {children}
    </div>
  )
}
