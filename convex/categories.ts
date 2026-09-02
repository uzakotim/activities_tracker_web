export interface CategoryDefinition {
  id: string;
  name: string;
  color: string;
  icon: string;
  keywords: string[];
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    id: "gaming",
    name: "Gaming",
    color: "#8B5CF6", // Purple
    icon: "Gamepad2",
    keywords: [
      "hollow knight", "elden ring", "game", "gaming", "playstation", "xbox", "nintendo", "switch",
      "steam", "minecraft", "fortnite", "valorant", "league of legends", "dota", "cs:go", "csgo",
      "counter strike", "apex legends", "overwatch", "zelda", "mario", "pokemon", "cyberpunk",
      "witcher", "gta", "grand theft auto", "roblox", "world of warcraft", "wow", "hearthstone",
      "chess", "balatro", "hades", "genshin", "starfield", "dark souls", "bloodborne", "sekiro",
      "call of duty", "warzone", "destiny", "fifa", "nba 2k", "rocket league", "pubg", "sims",
      "stardew valley", "terraria", "skyrim", "fallout", "god of war", "spiderman", "smash bros",
      "monster hunter", "diablo", "resident evil", "final fantasy", "persona", "silksong"
    ],
  },
  {
    id: "coding",
    name: "Coding & Tech",
    color: "#0284C7", // Cyan / Ocean Blue
    icon: "Code",
    keywords: [
      "code", "coding", "program", "programming", "developer", "development", "typescript",
      "javascript", "python", "react", "next.js", "nextjs", "node", "convex", "frontend",
      "backend", "fullstack", "github", "git", "pull request", "pr", "bug", "debugging",
      "refactor", "refactoring", "leetcode", "algo", "algorithms", "data structures",
      "sql", "database", "api", "docker", "kubernetes", "aws", "devops", "html", "css",
      "tailwind", "rust", "golang", "c++", "c#", "java", "swift", "flutter", "linux", "terminal",
      "system design", "code review", "deploy", "deployment", "merge conflict", "script"
    ],
  },
  {
    id: "fitness",
    name: "Fitness & Sports",
    color: "#059669", // Emerald Green
    icon: "Dumbbell",
    keywords: [
      "gym", "workout", "fitness", "run", "running", "jog", "jogging", "walk", "walking",
      "treadmill", "bench press", "squat", "squats", "deadlift", "pushups", "pullups",
      "calisthenics", "crossfit", "hiit", "cardio", "weights", "lifting", "swimming", "swim",
      "cycling", "bike", "biking", "yoga", "pilates", "stretching", "football", "soccer",
      "basketball", "tennis", "badminton", "volleyball", "boxing", "kickboxing", "mma",
      "bouldering", "climbing", "hiking", "skating", "skiing", "snowboarding", "leg day",
      "chest day", "arm day", "back day", "core workout", "abs", "marathon", "warmup"
    ],
  },
  {
    id: "work",
    name: "Work & Career",
    color: "#1E40AF", // Deep Royal Navy
    icon: "Briefcase",
    keywords: [
      "work", "job", "office", "meeting", "sync", "standup", "zoom", "teams", "client",
      "presentation", "pitch", "proposal", "email", "emails", "inbox", "slack", "jira",
      "trello", "notion", "spreadsheet", "excel", "report", "consulting", "sales", "marketing",
      "interview", "resume", "cv", "networking", "planning", "strategy", "review",
      "onboarding", "deadline", "quarterly", "kpi", "okr", "analytics", "admin work"
    ],
  },
  {
    id: "learning",
    name: "Learning & Study",
    color: "#D97706", // Amber / Warm Orange
    icon: "BookOpen",
    keywords: [
      "study", "studying", "learn", "learning", "read", "reading", "book", "course", "udemy",
      "coursera", "lecture", "homework", "exam", "test prep", "revision", "flashcards", "anki",
      "spanish", "french", "german", "japanese", "language", "duolingo", "research", "paper",
      "article", "tutorial", "masterclass", "webinar", "notes", "thesis", "quiz", "training"
    ],
  },
  {
    id: "creative",
    name: "Creative & Arts",
    color: "#DB2777", // Rose / Magenta
    icon: "Palette",
    keywords: [
      "draw", "drawing", "paint", "painting", "art", "sketch", "sketching", "design", "ui/ux",
      "figma", "photoshop", "illustrator", "music", "guitar", "piano", "drums", "bass", "singing",
      "songwriting", "beatmaking", "fl studio", "ableton", "logic pro", "video editing", "premiere",
      "davinci", "animation", "blender", "3d model", "3d modeling", "write novel", "poetry",
      "photography", "photo edit", "filming", "podcast recording", "voiceover", "crafts", "diy"
    ],
  },
  {
    id: "health",
    name: "Health & Self-Care",
    color: "#0D9488", // Teal
    icon: "Heart",
    keywords: [
      "meditation", "meditate", "mindfulness", "breathwork", "journal", "journaling", "therapy",
      "therapist", "doctor", "dentist", "skincare", "massage", "spa", "nap", "sleep", "rest",
      "hydrate", "stretching", "mental health", "wellness", "sauna", "cold plunge", "vitamins"
    ],
  },
  {
    id: "chores",
    name: "Chores & Errands",
    color: "#64748B", // Slate
    icon: "ShoppingBag",
    keywords: [
      "chore", "chores", "clean", "cleaning", "vacuum", "mop", "dishes", "dishwasher", "laundry",
      "wash clothes", "ironing", "tidy", "tidying", "grocery", "groceries", "supermarket",
      "trader joe", "costco", "errand", "errands", "cook", "cooking", "meal prep", "bake", "baking",
      "trash", "recycling", "car wash", "gas station", "post office", "bank", "vet", "dog walk"
    ],
  },
  {
    id: "social",
    name: "Social & Family",
    color: "#EA580C", // Vibrant Orange-Red
    icon: "Users",
    keywords: [
      "friend", "friends", "family", "hangout", "dinner", "lunch", "breakfast", "brunch", "coffee",
      "date", "party", "call mom", "call dad", "call parents", "facetime", "board game", "catch up",
      "drinks", "bar", "pub", "gathering", "celebration", "birthday", "wedding", "visit"
    ],
  },
  {
    id: "leisure",
    name: "Leisure & Media",
    color: "#6366F1", // Indigo
    icon: "Tv",
    keywords: [
      "movie", "film", "cinema", "watch", "watching", "netflix", "youtube", "tv show", "series",
      "anime", "manga", "podcast", "listen to music", "spotify", "scroll", "scrolling", "tiktok",
      "instagram", "twitter", "reddit", "relax", "relaxing", "chill", "chilling"
    ],
  },
  {
    id: "finance",
    name: "Finance & Admin",
    color: "#16A34A", // Green
    icon: "DollarSign",
    keywords: [
      "finance", "budget", "budgeting", "taxes", "tax", "crypto", "stocks", "invest", "investing",
      "portfolio", "bills", "invoice", "invoicing", "accounting", "banking", "expense", "expenses"
    ],
  },
];

export const OTHER_CATEGORY: CategoryDefinition = {
  id: "other",
  name: "Other Activities",
  color: "#475569", // Dark Slate
  icon: "Clock",
  keywords: [],
};
