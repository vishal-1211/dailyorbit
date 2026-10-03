# How the paper learns

All learning happens on the laptop, in `src/renderer/brain.js`. No paid service, no cloud model. State lives in `learning.json`.

## Signals

| Signal | Meaning |
|---|---|
| Story opened | Mild interest |
| How far it was read | Stronger interest the further; past halfway counts as a clear yes |
| Story shown but not opened | Not learned from; used only in the scorecard |
| 👍 / 👎 | Strong, explicit |
| Quiz answers | Sets quiz difficulty only |

## The model

1. **Understanding a story.** Each story gets a summary, opening paragraphs, key facts, numbers and quotes by extractive methods (sentence scoring, no generation).
2. **Word meanings.** The app builds its own word vectors from every article it downloads (random indexing, 48 dimensions, up to 4,000 terms). If the optional pre-trained model (all-MiniLM-L6-v2) is installed, its sentence embeddings are used as well.
3. **Taste.** An online logistic regression over hashed features (source, section, length, pictures, author, title and body terms) plus a taste vector in each embedding space. It updates after every signal.
4. **Ranking.** `rank = (1 − α) × editorial quality + α × predicted interest`, where α grows from 0 to 0.6 over the first 25 lessons. Quality covers freshness, length, pictures and how many publishers covered the story.
5. **Variety.** Every fifth slot goes to a good story outside the reader's usual taste, but never one the model is confident the reader dislikes.
6. **Merging.** The same story from several publishers is clustered and shown once.
7. **Sections.** Stories the keyword rules cannot place go to the nearest learned section centre.

## Checking that it works

| Check | Where | What it shows |
|---|---|---|
| Scorecard | Sources → What your paper has learned | For past editions: how often stories ranked high were opened, against stories ranked low |
| Check the model now | Same card | A language test on sentence pairs, a taste test on rated stories, and which model is in use |
| Why this? | Reader toolbar | The score for one story and the features that counted for and against |

`test/brain.test.js` checks the same things automatically on synthetic readers.

## Resetting

**Sources → Erase what it learned** deletes `learning.json`. The paper then ranks on editorial quality alone until it has learned again.
