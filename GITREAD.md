Git kommando liste

Se status
git status

Viser hvad der er ændret i projektet.

Tilføj filer til commit

Tilføj alle filer:

git add .

Tilføj én fil:

git add filnavn.js
Lav commit

Gem ændringer i Git historikken.

git commit -m "beskrivelse af ændring"

Eksempel:

git commit -m "added login page"
Send ændringer til GitHub
git push

Hvis det er første gang:

git push origin main
Hent ændringer fra GitHub
git pull
Se commit historik
git log

Kort version:

git log --oneline
Se hvad der er ændret
git diff
Opret ny branch
git branch ny-branch
Opret og skift til ny branch
git checkout -b ny-branch
Skift branch
git checkout main
Se alle branches
git branch
Gendan fil til sidste commit
git restore filnavn
Fjern fil fra staging
git restore --staged filnavn
Klon et repository
git clone URL
Se hvilket repository der er koblet på
git remote -v
Normal workflow

Når du arbejder:

git status
git add .
git commit -m "beskrivelse"
git push

Når du starter arbejde:

git pull