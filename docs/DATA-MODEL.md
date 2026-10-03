# Data model

There is no database. The app keeps a few JSON files in the per-user data folder (`%APPDATA%\The Astro Gazette\` on Windows). The diagram shows what they hold and how the pieces relate.

```mermaid
erDiagram
  CONFIG ||--|| SETTINGS : has
  CONFIG ||--o{ SOURCE : lists
  SETTINGS ||--|| LOCATION : has
  STATE ||--o{ SEEN_URL : remembers
  EDITION ||--o{ ARTICLE : contains
  EDITION ||--o{ SOURCE_STAT : reports
  EDITION ||--|| SKY_DATA : carries
  EDITION ||--|| EXTRAS : carries
  SOURCE ||--o{ ARTICLE : publishes
  SOURCE ||--o{ SOURCE_STAT : "measured by"
  ARTICLE }o--o{ IMAGE : shows
  ARTICLE ||--o{ ARTICLE : "merged with (alsoBy)"
  EXTRAS ||--o{ QUIZ_QUESTION : includes
  LEARNING ||--|| BRAIN_STATE : holds
  LEARNING ||--o{ EDITION_LOG : holds
  EDITION ||--o| EDITION_LOG : "read as"
  EDITION_LOG ||--o{ LOG_ENTRY : has
  ARTICLE ||--o| LOG_ENTRY : "tracked by"

  CONFIG {
    object settings
    array sources
    array seenDefaults "default source ids already offered"
  }
  SETTINGS {
    int windowDays "1-30, default 7"
    int maxPerSource "default 15"
    int maxPages "8-30, default 24"
    string theme "night or day"
    string paperSize
    string readerSize
    bool turnGestures "default false"
    bool readerContinuous "default false"
    string proxyMode "off, tor or custom"
    string proxyUrl
    bool warnOriginal
  }
  LOCATION {
    string name
    float lat
    float lon
  }
  SOURCE {
    string id PK
    string name
    string url "feed address"
    bool enabled
    bool astroOnly "keep astronomy items only"
    string urlMatch "optional link filter"
  }
  STATE {
    int lastGeneratedAt "ms, end of the last edition"
    int editionCount
  }
  SEEN_URL {
    string url PK
    int seenAt "forgotten after 21 days"
  }
  EDITION {
    string id PK "timestamp, also the file name"
    int number
    int createdAt
    int since "window start"
    int until "window end"
    string mode "first, since-last or capped"
    float gapDays
    int windowDays
  }
  ARTICLE {
    string id PK
    string sourceId FK
    string title
    string url
    string canon "normalised url"
    string author
    int published
    string image "gzimg address"
    string html "cleaned full text"
    int words
    bool partial "feed summary only"
    string section "sky, solar, missions, deep, frontiers"
    string summary
    string lede
    array facts
    array numbers
    array quotes
    array terms
    array vec "optional pre-trained embedding"
    float q "editorial quality"
    float p "predicted interest 0-1"
    float rank
    bool variety "outside-usual-taste pick"
    bool dup "merged into another story"
    int coverage "publishers covering it"
    bool read
  }
  SOURCE_STAT {
    string id FK
    string status
    int found
    int used
    int paywalled
    int failed
    int dupes
    int failing "editions in a row unreachable"
  }
  SKY_DATA {
    string tle "space-station orbits"
    object cad "asteroid close approaches"
    int fetchedAt
  }
  EXTRAS {
    array didYouKnow
    array funFacts
    array numbers
    array memes
    object people
    object instruments
    array onThisDay
  }
  QUIZ_QUESTION {
    string id PK
    string q
    array options
    int answer
    string storyId FK "when taken from a story"
  }
  IMAGE {
    string file PK "sha1 of the address + extension"
  }
  LEARNING {
    object state
    object logs "keyed by edition id"
  }
  EDITION_LOG {
    string editionId FK
    object quiz "question id to chosen answer (stored as _quiz)"
  }
  LOG_ENTRY {
    string articleId FK
    int seen
    int opened
    float completion "0-1, how far it was read"
    int thumb "1, -1 or 0"
  }
  BRAIN_STATE {
    float n "lessons learned"
    float bias
    object w "feature weights"
    object terms "word vectors"
    array profile "taste vector, self-taught"
    array profileX "taste vector, pre-trained"
    object centroids "section centres"
    object track "scorecard counts"
    object quiz "asked, correct"
    object health "per-source failures"
    array usedFacts
    array usedQuiz
    array usedPeople
    array usedInstruments
  }
```

## Files on disk

| File | Holds | Written when |
|---|---|---|
| `config.json` | CONFIG, SETTINGS, LOCATION, SOURCE | Settings or sources change |
| `state.json` | STATE, SEEN_URL | An edition is printed |
| `editions/<id>.json` | One EDITION with its ARTICLEs, SOURCE_STATs, SKY_DATA and EXTRAS. The newest 30 are kept | An edition is printed; a story is first opened |
| `images/<sha1>.<ext>` | IMAGE. Pictures no remaining edition uses are deleted | An edition is printed |
| `learning.json` | LEARNING, BRAIN_STATE, EDITION_LOG, LOG_ENTRY | While reading |

Files are written to a temporary name and then renamed, so a crash never leaves a half-written file.

## Notes

- Things computed for display are not stored: page layout, and sky events for the chosen location (worked out from SKY_DATA plus LOCATION each time).
- `learning.json` is the only file about the reader's behaviour. **Sources → Erase what it learned** deletes it.
- Deleting `state.json` makes the next edition a fresh 7-day one.
- Old `config.json` files are upgraded by `src/migrate.js`: new default sources are offered once, moved feed addresses are corrected, removed sources stay removed.
