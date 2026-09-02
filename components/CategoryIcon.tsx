"use client";

import React from "react";
import {
  Gamepad2,
  Code,
  Dumbbell,
  Briefcase,
  BookOpen,
  Palette,
  Heart,
  ShoppingBag,
  Users,
  Tv,
  DollarSign,
  Clock,
  Sparkles,
  LucideProps,
} from "lucide-react";

interface CategoryIconProps extends LucideProps {
  name?: string;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  switch (name?.toLowerCase()) {
    case "gamepad2":
    case "gamepad":
    case "gaming":
      return <Gamepad2 {...props} />;
    case "code":
    case "coding":
    case "terminal":
      return <Code {...props} />;
    case "dumbbell":
    case "fitness":
    case "sports":
      return <Dumbbell {...props} />;
    case "briefcase":
    case "work":
    case "office":
      return <Briefcase {...props} />;
    case "bookopen":
    case "book":
    case "learning":
    case "study":
      return <BookOpen {...props} />;
    case "palette":
    case "creative":
    case "art":
      return <Palette {...props} />;
    case "heart":
    case "health":
    case "wellness":
      return <Heart {...props} />;
    case "shoppingbag":
    case "shopping":
    case "chores":
      return <ShoppingBag {...props} />;
    case "users":
    case "social":
    case "family":
      return <Users {...props} />;
    case "tv":
    case "leisure":
    case "entertainment":
      return <Tv {...props} />;
    case "dollarsign":
    case "finance":
      return <DollarSign {...props} />;
    case "sparkles":
      return <Sparkles {...props} />;
    default:
      return <Clock {...props} />;
  }
}
