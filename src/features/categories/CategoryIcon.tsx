import type { LucideIcon } from "lucide-react";
import {
  BedDouble, BookOpen, Bot, BusFront, CakeSlice, Car, Cigarette, Droplets,
  CircleEllipsis, CirclePlus, Clapperboard, Coffee, Coins, CookingPot,
  Cpu, CreditCard, Dumbbell, FileText, Flower2, Footprints, Gift,
  FerrisWheel, Flame, Gamepad2, GlassWater, Glasses, GraduationCap, HandCoins, HandHeart, Headphones,
  HeartPulse, Home, Hospital, KeyRound, Landmark, Laptop, MicVocal,
  Music, Package, PartyPopper, PencilRuler, Pill, Plane, Presentation,
  ReceiptText, RefreshCw, Shirt, ShoppingBasket, Smartphone, Sparkles,
  SprayCan, Stethoscope, Ticket, TrainFront, Trees, Trophy, Tv,
  Utensils, Watch, Wifi, Wrench, Zap,
} from "lucide-react";
import { cn } from "cn";

const icons: Record<string, LucideIcon> = {
  utensils: Utensils, "cooking-pot": CookingPot, house: Home,
  "cup-soda": Coffee, "glass-water": GlassWater, bottle: GlassWater,
  coffee: Coffee, milk: GlassWater, zap: Zap, ellipsis: CircleEllipsis,
  "key-round": KeyRound, landmark: Landmark, flame: Flame, droplets: Droplets, wifi: Wifi, smartphone: Smartphone,
  "bus-front": BusFront, "train-front": TrainFront, "tram-front": TrainFront,
  "car-taxi-front": Car, "graduation-cap": GraduationCap, "file-text": FileText,
  presentation: Presentation, "book-open": BookOpen, "pencil-ruler": PencilRuler,
  cpu: Cpu, laptop: Laptop, headphones: Headphones, wrench: Wrench, shirt: Shirt,
  footprints: Footprints, watch: Watch, "heart-pulse": HeartPulse,
  stethoscope: Stethoscope, pill: Pill, glasses: Glasses, hospital: Hospital,
  "party-popper": PartyPopper, "ferris-wheel": FerrisWheel,
  clapperboard: Clapperboard, music: Music, trophy: Trophy,
  "mic-vocal": MicVocal, "gamepad-2": Gamepad2, coins: Coins, trees: Trees,
  sparkles: Sparkles, "refresh-cw": RefreshCw, bot: Bot, tv: Tv,
  dumbbell: Dumbbell, plane: Plane, "plane-takeoff": Plane, ticket: Ticket,
  "bed-double": BedDouble, gift: Gift, "cake-slice": CakeSlice,
  "flower-2": Flower2, "hand-heart": HandHeart, "hand-coins": HandCoins,
  "badge-dollar-sign": Coins, "receipt-text": ReceiptText,
  "shopping-basket": ShoppingBasket, "spray-can": SprayCan,
  cigarette: Cigarette, package: Package, "circle-plus": CirclePlus,
};

export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && icons[icon]) || CreditCard;
  return <Icon aria-hidden="true" className={cn("size-5", className)} />;
}
