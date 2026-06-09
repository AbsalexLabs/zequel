'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CODING_LANGUAGES, getLanguageMeta } from '@/lib/coding/languages'
import { FileLanguageIcon } from './file-language-icon'
import type { CodingLanguage } from '@/lib/types'

/**
 * Searchable language picker built on our own UI primitives (Popover + Command)
 * — no native browser <select>. Users can search across the full language list.
 */
export function LanguagePicker({
  value,
  onChange,
  className,
  triggerClassName,
}: {
  value: CodingLanguage
  onChange: (value: CodingLanguage) => void
  className?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const current = getLanguageMeta(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select language"
          className={cn(
            'h-8 justify-between gap-2 font-mono text-xs',
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <FileLanguageIcon language={value} size={16} />
            <span className="truncate">{current.label}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-56 p-0', className)}
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search language..." className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
              No language found.
            </CommandEmpty>
            <CommandGroup>
              {CODING_LANGUAGES.map((lang) => (
                <CommandItem
                  key={lang.id}
                  value={`${lang.label} ${lang.id} ${lang.extension}`}
                  onSelect={() => {
                    onChange(lang.id)
                    setOpen(false)
                  }}
                  className="gap-2 font-mono text-xs"
                >
                  <FileLanguageIcon language={lang.id} size={16} />
                  <span className="flex-1 truncate">{lang.label}</span>
                  <span className="text-[10px] text-muted-foreground">.{lang.extension}</span>
                  <Check
                    className={cn(
                      'h-3.5 w-3.5',
                      value === lang.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
