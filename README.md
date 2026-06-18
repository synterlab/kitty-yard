# 🐾 Kitty Yard

A relaxing mobile-first web game about stray cats visiting your yard. Place food and toys, attract unique cats, and build your collection — all at your own pace.

**Play it live:** https://synterlab.github.io/kitty-yard

## Features

- 22 unique cats across Common, Rare, and Legendary rarity tiers
- 8 items to place (dried fish, tuna bits, cat grass, wool ball, toy mouse, cardboard box, soft cushion, feather wand)
- 3 unlockable areas: Front Yard, Flower Garden, Wooden Deck
- Cat collection album with locked silhouettes for undiscovered cats
- Scrapbook / memory gallery of all visits
- Offline simulation — cats visit even while the tab is closed
- Auto-save via localStorage — progress persists across sessions
- Mobile-first design with bottom tab bar navigation

## How to Play

1. **Place items** in the yard slots (tap a slot, then pick an item from your inventory)
2. **Wait** — cats will visit on their own based on what you've placed
3. **Collect gifts** — each visiting cat leaves Snack Coins when they depart
4. **Spend coins** in the Shop to buy more items, unlock areas, and add slots
5. **Complete your collection** by attracting all 22 cats

## Running Locally

No build step needed — just open `index.html` in a browser (served via a local server for ES modules):

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Tech Stack

- Pure HTML / CSS / JavaScript (ES Modules)
- No dependencies, no build step
- LocalStorage for persistence
- Google Fonts (Nunito)
