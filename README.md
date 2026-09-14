# Waypoints

A shared map for pinning places and leaving reviews on them. Signed-in users can add pins, rate places out of five stars, write a short note, and read what everyone else thought.

## Features

- Search for a place by name (OpenStreetMap Nominatim) or drag the pin icon onto the map to drop a pin anywhere
- One review per user per place, which you can edit later
- Average rating and a list of all reviews for each pin
- Light and dark map themes
- Installable as a PWA

## Stack

- [Next.js](https://nextjs.org) 16 with React 19
- [Supabase](https://supabase.com) for auth and the Postgres database
- [MapLibre GL](https://maplibre.org) with the OpenFreeMap Liberty style
- Vitest and Testing Library for tests

## Running locally

You need Node 22 and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Set up the database by running [supabase/schema.sql](supabase/schema.sql) and then the files in [supabase/migrations](supabase/migrations) against your project, either in the SQL editor or with the Supabase CLI.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   The app runs at [http://localhost:3000](http://localhost:3000).

There is no sign-up page since every instance is meant to be a private thing, so create users from the Supabase dashboard. A `name` field in the user's metadata is copied into their profile and shown next to their reviews. You can also manually edit/add their name from the `profiles` table after account creation.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

The MapLibre worker files are copied into `public/maplibre/` on install, dev, and build. If the map fails to load, run `npm run sync:maplibre`.

## Database

Three tables, all with row level security enabled:

- `profiles`: one row per auth user, created automatically on sign-up
- `places`: the pins, with a name and coordinates
- `opinions`: reviews, with a rating from 1 to 10 (shown as half stars) and an optional note

Any signed-in user can read everything, add places, and delete places. Reviews can only be edited or deleted by the person who wrote them.

## License

See [LICENSE](LICENSE).
