'use client'

import { useIsMobile } from '@/hooks/use-mobile'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { DocumentPanel } from './document-panel'
import { ResearchPanel } from './research-panel'
import { StudyPanel } from './study-panel'
import { EvidencePanel } from './evidence-panel'
import { ConversationsPanel } from './conversations-panel'
import { useWorkspaceStore } from '@/lib/store'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'
import {
  FileText,
  Search,
  BookOpen,
  GraduationCap,
  FlaskConical,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'

interface WorkspaceShellProps {
  onUploadClick: () => void
  userEmail?: string
  profile?: Profile | null
}

export function WorkspaceShell({
  onUploadClick,
  userEmail,
  profile,
}: WorkspaceShellProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <MobileWorkspace
        onUploadClick={onUploadClick}
        userEmail={userEmail}
        profile={profile}
      />
    )
  }

  return (
    <DesktopWorkspace
      onUploadClick={onUploadClick}
      userEmail={userEmail}
      profile={profile}
    />
  )
}

/* Mode Switcher — equal-width buttons, centered */
function ModeSwitcher() {
  const { mode, setMode } = useWorkspaceStore()

  return (
    <div className="flex items-center rounded-md border border-border bg-secondary/50 p-0.5">
      <button
        onClick={() => setMode('study')}
        className={cn(
          'flex w-24 items-center justify-center gap-1.5 rounded-[5px] py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all',
          mode === 'study'
            ? 'bg-foreground text-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <GraduationCap className="h-3.5 w-3.5" />
        Study
      </button>
      <button
        onClick={() => setMode('research')}
        className={cn(
          'flex w-24 items-center justify-center gap-1.5 rounded-[5px] py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all',
          mode === 'research'
            ? 'bg-foreground text-background shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <FlaskConical className="h-3.5 w-3.5" />
        Research
      </button>
    </div>
  )
}

function DesktopWorkspace({
  onUploadClick,
  userEmail,
  profile,
}: WorkspaceShellProps) {
  const { mode } = useWorkspaceStore()

  return (
    <div className="h-svh w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel — Document Control (22%) */}
        <ResizablePanel defaultSize={22} minSize={16} maxSize={30}>
          <DocumentPanel
            onUploadClick={onUploadClick}
            userEmail={userEmail}
            profile={profile}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Center Panel — Study or Research (56%) */}
        <ResizablePanel defaultSize={56} minSize={40}>
          <div className="flex h-full flex-col overflow-hidden">
            {/* Mode Switcher Bar — centered */}
            <div className="flex shrink-0 items-center justify-center px-4 py-2.5">
              <ModeSwitcher />
            </div>
            <Separator className="shrink-0" />
            {/* Panel Content */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {mode === 'study' ? <StudyPanel /> : <ResearchPanel />}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel — Conversations (study) or Evidence (research) */}
        <ResizablePanel defaultSize={22} minSize={16} maxSize={30}>
          {mode === 'study' ? <ConversationsPanel /> : <EvidencePanel />}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

function getDisplayName(profile?: Profile | null, userEmail?: string) {
  if (profile?.full_name) return profile.full_name
  if (profile?.display_name) return profile.display_name
  if (profile?.username) return `@${profile.username}`
  return userEmail || 'Account'
}

function getInitials(profile?: Profile | null, userEmail?: string) {
  const name =
    profile?.full_name || profile?.display_name || userEmail || 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function MobileWorkspace({
  onUploadClick,
  userEmail,
  profile,
}: WorkspaceShellProps) {
  const { activeMobileTab, setActiveMobileTab, mode } = useWorkspaceStore()

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-mono text-xs font-semibold text-foreground">Zequel</span>
        <div className="flex items-center gap-2">
          <ModeSwitcher />
          <ThemeToggle />
          <Link href="/settings">
            <Avatar className="h-6 w-6">
              {profile?.avatar_url ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={getDisplayName(profile, userEmail)}
                />
              ) : null}
              <AvatarFallback className="bg-secondary font-mono text-[9px] text-foreground">
                {getInitials(profile, userEmail)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
      <Separator />

      {/* Content Area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {activeMobileTab === 'documents' && (
            <DocumentPanel
              onUploadClick={onUploadClick}
              userEmail={userEmail}
              profile={profile}
              hideHeader
            />
          )}
          {activeMobileTab === 'research' &&
            (mode === 'study' ? <StudyPanel /> : <ResearchPanel />)}
          {activeMobileTab === 'evidence' &&
            (mode === 'study' ? <ConversationsPanel /> : <EvidencePanel />)}
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <Separator />
      <nav className="flex items-center bg-background" role="tablist">
        <MobileTab
          icon={<FileText className="h-4 w-4" />}
          label="Documents"
          isActive={activeMobileTab === 'documents'}
          onClick={() => setActiveMobileTab('documents')}
        />
        <MobileTab
          icon={
            mode === 'study' ? (
              <GraduationCap className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )
          }
          label={mode === 'study' ? 'Study' : 'Research'}
          isActive={activeMobileTab === 'research'}
          onClick={() => setActiveMobileTab('research')}
        />
        <MobileTab
          icon={
            mode === 'study' ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )
          }
          label={mode === 'study' ? 'Chats' : 'Evidence'}
          isActive={activeMobileTab === 'evidence'}
          onClick={() => setActiveMobileTab('evidence')}
        />
      </nav>
    </div>
  )
}

function MobileTab({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {icon}
      <span className="font-mono text-[9px] uppercase tracking-wider">
        {label}
      </span>
    </button>
  )
}
