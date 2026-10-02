import product from './product'
import curator from './curator' // 1. Legg til denne linjen på toppen
import magazineIssue from './magazineIssue'
import makerChapter from './makerChapter'

export const schemaTypes = [
  product, 
  curator, // 2. Legg til denne i listen
  magazineIssue,
  makerChapter,
]
