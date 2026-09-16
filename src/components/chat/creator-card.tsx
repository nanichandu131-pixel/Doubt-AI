'use client';

import { useState } from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import Image from 'next/image';
import {
  AtSign,
  Award,
  BadgeCheck,
  Check,
  FolderGit2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Target,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { CREATOR, type CreatorCardMode } from '@/lib/creator';
import { cn } from '@/lib/utils';

type SvgProps = SVGProps<SVGSVGElement>;

function LinkedinIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function GithubIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const chip =
  'inline-flex rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[0.7rem] text-foreground/85';

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {title}
      </h4>
      {children}
    </section>
  );
}

export function CreatorCard({ mode }: { mode: CreatorCardMode }) {
  const detailed = mode === 'detailed';
  const [imageFailed, setImageFailed] = useState(false);
  const initials = CREATOR.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  const contacts: Array<{
    icon: ComponentType<SvgProps>;
    label: string;
    href: string;
    external: boolean;
  }> = [
    { icon: Mail, label: CREATOR.email, href: `mailto:${CREATOR.email}`, external: false },
    { icon: Phone, label: CREATOR.phone, href: CREATOR.phoneHref, external: false },
    { icon: LinkedinIcon, label: CREATOR.linkedinLabel, href: CREATOR.linkedinUrl, external: true },
    { icon: GithubIcon, label: CREATOR.githubLabel, href: CREATOR.githubUrl, external: true },
  ];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-semibold">{CREATOR.name}</p>
          <p className="truncate text-xs text-muted-foreground">{CREATOR.role}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-medium whitespace-nowrap text-primary">
          <Sparkles className="size-3" />
          Creator of Doubt AI
        </span>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_240px]">
        <div
          className={cn(
            'order-2 min-w-0 divide-y divide-border/60',
            'md:order-1',
            detailed && 'max-h-[min(68vh,540px)] overflow-y-auto overscroll-contain',
          )}
        >
          <Section icon={UserRound} title="Professional Summary">
            <p className="text-xs leading-relaxed text-foreground/85">
              {detailed ? CREATOR.summary : CREATOR.summaryShort}
            </p>
          </Section>

          <Section icon={AtSign} title="Contact">
            <ul className="grid gap-1 sm:grid-cols-2 md:grid-cols-1">
              {contacts.map(({ icon: Icon, label, href, external }) => (
                <li key={label} className="min-w-0">
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-foreground/80 transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="truncate">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 flex items-center gap-2 px-1.5 text-xs text-muted-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
                <MapPin className="size-3.5" />
              </span>
              {CREATOR.location}
            </p>
          </Section>

          <Section icon={Wrench} title="Technical Skills">
            <div className="space-y-2.5">
              {CREATOR.skills.map((group) => (
                <div key={group.name}>
                  <p className="mb-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground/80 uppercase">
                    {group.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.skills.map((skill) => (
                      <span key={skill} className={chip}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {detailed && (
            <>
              <Section icon={FolderGit2} title="Project">
                <p className="text-[0.9rem] font-semibold">{CREATOR.project.title}</p>
                <p className="text-xs text-muted-foreground">{CREATOR.project.subtitle}</p>
                <ul className="mt-2 space-y-1.5">
                  {CREATOR.project.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-1.5 text-xs leading-relaxed text-foreground/85"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section icon={GraduationCap} title="Education">
                <ol className="space-y-2.5">
                  {CREATOR.education.map((entry) => (
                    <li key={entry.title} className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.6rem] font-semibold text-muted-foreground">
                        {entry.period}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs leading-snug font-medium">{entry.title}</p>
                        <p className="text-[0.7rem] text-muted-foreground">{entry.institution}</p>
                        {entry.result && (
                          <p className="mt-0.5 text-[0.7rem] font-medium text-primary/80">{entry.result}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>

              <Section icon={Award} title="Certifications & Achievements">
                <ul className="space-y-1.5">
                  {CREATOR.certifications.map((certification) => (
                    <li
                      key={certification}
                      className="flex items-start gap-1.5 text-xs leading-relaxed text-foreground/85"
                    >
                      <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{certification}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section icon={Target} title="Strengths & Workstyle">
                <ul className="space-y-1.5">
                  {CREATOR.strengths.map((strength) => (
                    <li
                      key={strength}
                      className="flex items-start gap-1.5 text-xs leading-relaxed text-foreground/85"
                    >
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </div>

        <div className="order-1 border-b border-border/60 bg-gradient-to-b from-muted/25 to-transparent p-5 md:order-2 md:border-b-0 md:border-l md:bg-none md:p-4">
          <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-border/70 shadow-sm ring-1 ring-primary/10">
            {imageFailed ? (
              <div className="flex size-full items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground">
                {initials}
              </div>
            ) : (
              <Image
                src={CREATOR.imagePath}
                alt={CREATOR.name}
                fill
                sizes="(min-width: 768px) 220px, 80vw"
                unoptimized
                onError={() => setImageFailed(true)}
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}