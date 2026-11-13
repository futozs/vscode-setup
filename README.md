# vscode-setup

Saját VS Code beállításom macOS-re. Kevés bővítmény, gyors indulás, Copilot helyett Claude Code, és egy téma, amitől estére sem fáj a szemem. Egy paranccsal visszaállítható bármelyik Macen.

```bash
git clone https://github.com/futozs/vscode-setup.git ~/Developer/personal/vscode-setup
cd ~/Developer/personal/vscode-setup && ./install.sh
```

Teljesen tiszta újrakezdéshez (ez mindent töröl, de előtte elment):

```bash
./install.sh --fresh
```

Az `install.sh` symlinkeli a `settings.json`-t és a `keybindings.json`-t a VS Code `User` mappájába, így a repó az egyetlen forrás: amit a felületen átállítasz, az itt jelenik meg diffként. A bővítményeket a lista alapján szinkronizálja, vagyis telepíti, ami hiányzik, és eltávolítja, ami nincs a listán. Amit felülír, azt előtte a `~/vscode-backups/<időbélyeg>/` mappába menti. Bármikor újrafuttatható.

## Filozófia

1. **Minden bővítmény lassít.** Csak az kerül be, ami a napi munkában tényleg dolgozik. Amit a VS Code már magától tud, az nem kell: az auto rename tag helyett ott a `linkedEditing`, az indent-rainbow helyett a bracket pair guide-ok, a GitLens helyett a beépített git blame és a Source Control gráf, a Project Manager helyett a `Ctrl+R` és a `pc` parancs.
2. **Egy AI, nem kettő.** A beépített Copilot (chat, inline javaslatok, next edit) a `chat.disableAIFeatures` beállítással ki van kapcsolva. Az AI-t a Claude Code adja.
3. **A watcher a szűk keresztmetszet.** Nagy JS repóknál a fájlfigyelő eszi a CPU-t. A `node_modules`, a `.next`, a build mappák és a `.claude/worktrees` ki vannak zárva a figyelésből és a keresésből.
4. **A projekt dönt a formázásról.** A Prettier csak akkor formáz, ha a repóban van Prettier config (`prettier.requireConfig`). Így egy csapatrepóban nem formázod át mások fájljait.
5. **Nehéz dolgok külön profilban.** A Java/Kotlin language serverek külön profilba kerültek, a webes munkát nem lassítják.

## Mi van benne

| Fájl | Tartalom |
|---|---|
| `settings.json` | Téma, betűk, layout, formázás, fájlfigyelés, TS 7, git, terminál. A nem magától értetődő sorok mellett megjegyzés áll. |
| `keybindings.json` | Kevés, de használt billentyű (lent). |
| `extensions/core.txt` | Az alap profil bővítményei. |
| `extensions/php.txt`, `android.txt` | Extra profilok: `./install.sh --profiles php,android`. A beállításokat és a billentyűket az alap profillal közösen használják. |
| `shell/dev.zsh` | `p`, `pc`, `c` parancsok és zoxide. Az installer a `~/.zshrc`-ből hivatkozik rá. |

### Bővítmények

| Mire | Mi |
|---|---|
| AI | Claude Code |
| Téma | Catppuccin (Mocha sötét, Latte világos, a macOS-hez igazodva vált), Catppuccin ikonok |
| TypeScript | TypeScript 7 natív language service (`js/ts.experimental.useTsgo`), kb. tízszer gyorsabb, mint a régi tsserver |
| Lint, formázás | ESLint, Prettier |
| Stack | Tailwind CSS IntelliSense (`cn()`, `cva()`, `clsx()` támogatással), Prisma, Bun, Vue (Nuxt), YAML, TOML, dotenv |
| Hibák | Error Lens (a hiba a sor végén jelenik meg), Pretty TypeScript Errors |
| Tesztek | Vitest, Playwright |
| CI | GitHub Actions |

### Layout

- Activity bar felül, oldalsáv jobbra: a kód nem ugrál, ha kinyitod vagy becsukod az oldalsávot.
- Nincs minimap, van sticky scroll (a sticky scroll az aktuális függvény vagy komponens fejlécét mutatja).
- Legfeljebb 10 fül szerkesztőcsoportonként, a legrégebbi magától bezárul.
- File nesting: a `package.json` alá kerülnek a lockfile-ok, a `tsconfig.json` alá a `next-env.d.ts`, a `README.md` alá az `AGENTS.md` és a `CLAUDE.md`, a komponens alá a teszt és a story.
- Az autosave fókuszváltáskor ment, nem gépelés közben, így a dev szerver nem buildel újra minden szünetnél.

### Billentyűk

| Billentyű | Mit csinál |
|---|---|
| `Cmd+Esc` | Claude Code fókusz (a bővítmény alapértelmezése) |
| `Ctrl+R` / `Alt+Cmd+O` | Legutóbbi projektek |
| `Shift+Cmd+R` | Ablak újratöltése, ha egy bővítmény beakad |
| `Alt+Cmd+W` | A többi fül bezárása |
| `Shift+Enter` (terminálban) | Új sor a Claude Code CLI-ben, nem küldés |

### Terminál

```bash
p karth     # fuzzy keresés a ~/Developer repói között, majd cd
pc karth    # ugyanez, és megnyitja VS Code-ban
z racehub   # zoxide: ugrás egy gyakran használt mappába
c           # az aktuális mappa megnyitása VS Code-ban
```

## Mappaszerkezet

A kód nem a Documentsben van (azt a macOS iCloud-szinkronizálhatja, és a Spotlight is indexeli), hanem a `~/Developer` mappában. Ezt a mappát a Finder kalapács ikonnal jelöli.

```
~/Developer/
├── clients/    ügyfélprojektek, cégenként almappával, ha több repó tartozik egy ügyfélhez
├── personal/   saját projektek, köztük ez a repó és a claude-setup
├── school/     iskola, versenyek
├── archive/    régi verziók, amikhez már nem nyúlok
└── sandbox/    gyors kísérletek, bármikor törölhető
```

## Kapcsolódó

- [claude-setup](https://github.com/futozs/claude-setup): a Claude Code konfigurációm

## Licenc

MIT
