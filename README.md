# MY AI Work Index (Malaysia)

Interactive React dashboard to explore AI exposure risk across Malaysian occupations.

## Features

- Explore occupations with **cards or table view**
- Visual analytics: risk bands, group averages, impact mix, risk-vs-salary scatter
- Rankings for highest risk, most resilient, and in-demand roles
- Mobile-friendly layout and slide-in detail drawer
- **Real-time data pulling with fallback** (polls every 60 seconds)

## Real-time data pulling

The app now attempts to fetch live data every 60s from:

- `VITE_DATA_URL` (if provided), otherwise
- `/live-data.json`

Expected payload shape:

```json
{
  "occupations": [
    {
      "id": 1,
      "code": "4110",
      "title": "General Office Clerk",
      "group": "Clerical Support",
      "risk": 78,
      "salary": 2100,
      "impact": "At Risk",
      "demand": false,
      "myscol": false,
      "workers": 280000
    }
  ],
  "stateRegions": [
    {
      "region": "Peninsular Malaysia",
      "states": [
        {
          "id": "johor",
          "name": "Johor",
          "short": "JHR",
          "gdp": "RM 180B",
          "topSectors": ["Manufacturing"],
          "medianSalary": 2800,
          "unemployment": 3.1,
          "highlight": "..."
        }
      ]
    }
  ]
}
```

If live fetch fails, the UI automatically falls back to bundled local data and shows **Local fallback** status.

## Font

The interface uses **Inter** as the main UI font.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Environment

Create `.env` (optional):

```bash
VITE_DATA_URL=https://your-api-or-cdn/live-data.json
```
