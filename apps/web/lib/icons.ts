import {
  Zap, Scale, BarChart3, HeartPulse, Users, TrendingUp,
  Microscope, Settings, GraduationCap, Palette,
  FileCheck, Target, BookOpen, Vote, Search,
  Shield, AlertTriangle, Clock, Trophy, ArrowUpRight,
  ArrowDownRight, ChevronRight, Plus, X, Menu,
  Github, Mail, Lock, User, Eye, EyeOff,
  ExternalLink, Copy, Check, Info, AlertCircle,
  Sparkles, Brain, Network, Layers, Archive,
  type LucideIcon,
} from "lucide-react";

export const VerticalIcons: Record<string, LucideIcon> = {
  engineering: Zap,
  legal: Scale,
  finance: BarChart3,
  healthcare: HeartPulse,
  "hr-hcm": Users,
  marketing: TrendingUp,
  research: Microscope,
  operations: Settings,
  education: GraduationCap,
  creative: Palette,
};

export const FeedIcons: Record<string, LucideIcon> = {
  proof: FileCheck,
  problem: Target,
  commons: BookOpen,
  vote: Vote,
};

export const StatusIcons = {
  search: Search,
  shield: Shield,
  alert: AlertTriangle,
  clock: Clock,
  trophy: Trophy,
  up: ArrowUpRight,
  down: ArrowDownRight,
  chevron: ChevronRight,
  plus: Plus,
  close: X,
  menu: Menu,
  github: Github,
  mail: Mail,
  lock: Lock,
  user: User,
  eye: Eye,
  eyeOff: EyeOff,
  external: ExternalLink,
  copy: Copy,
  check: Check,
  info: Info,
  warning: AlertCircle,
  sparkles: Sparkles,
  brain: Brain,
  network: Network,
  layers: Layers,
  archive: Archive,
} as const;

export { type LucideIcon };
