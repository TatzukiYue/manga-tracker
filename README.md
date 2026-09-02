# Manga Tracker

A web-based manga tracking application built with React and Supabase.

## Features

- Add manga to your personal library
- Store manga title, type, current chapter, date, source, review, and cover image
- Search manga by title
- Filter manga by origin:
  - Korean
  - Japanese
  - Chinese
  - Other
- Edit existing manga information
- Delete manga from the library
- Store manga data using Supabase

## Technologies Used

- React
- Vite
- JavaScript
- CSS
- Supabase

## Installation

1. Clone this repository:

```bash
git clone https://github.com/TatzukiYue/manga-tracker.git
```

2. Navigate to the project folder:

```bash
cd manga-tracker
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the project root and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

5. Start the development server:

```bash
npm run dev
```

The application will then be available at:

```text
http://localhost:5173
```

## Environment Variables
This project uses Supabase for database storage.
Create a .env file based on .env.example and add your Supabase project credentials.

## Author
Created as a personal manga tracking project.