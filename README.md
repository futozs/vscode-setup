# vscode-setup

Saját VS Code beállításom macOS-re. Kevés bővítmény, gyors indulás, a Copilotból csak a kódkiegészítés marad, beszélgetni a Claude Code-dal lehet, és a téma estére sem bántja a szemet. Egy paranccsal visszaállítható bármelyik Macen.

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

1. **Minden bővítmény lassít.** Csak az kerül be, ami a napi munkában tényleg dolgozik, vagy csak akkor töltődik be, amikor megnyitod a hozzá tartozó fájlt (PDF, SVG, CSV). Amit a VS Code már magától tud, az nem kell: az auto rename tag helyett ott a `linkedEditing`, az indent-rainbow helyett a bracket pair guide-ok, a GitLens helyett a beépített git blame és a Source Control gráf. A Project Managert egy saját, 200 soros bővítmény váltja ki (lent).
2. **Egy asszisztens, akivel beszélsz.** A VS Code-ba épített Copilotból csak az marad, ami gépelés közben segít: a szürke kódkiegészítés és a next edit javaslat. A Copilot chatje, az agent mód és a címsorban lévő agent-gomb ki van kapcsolva. Beszélgetni, tervezni és nagyobb változtatást végezni a Claude Code-dal lehet.
3. **A watcher a szűk keresztmetszet.** Nagy JS repóknál a fájlfigyelő eszi a CPU-t. A `node_modules`, a `.next`, a build mappák és a `.claude/worktrees` ki vannak zárva a figyelésből és a keresésből.
4. **A projekt dönt a formázásról.** A Prettier csak akkor formáz, ha a repóban van Prettier config (`prettier.requireConfig`). Így egy csapatrepóban nem formázod át mások fájljait.
5. **Nehéz dolgok külön profilban.** A Java/Kotlin language serverek külön profilba kerültek, a webes munkát nem lassítják.

## Mi van benne

| Fájl | Tartalom |
|---|---|
| `settings.json` | Téma, betűk, layout, formázás, fájlfigyelés, TS 7, git, terminál. A nem magától értetődő sorok mellett megjegyzés áll. |
| `keybindings.json` | Kevés, de használt billentyű (lent). |
| `extensions/core.txt` | Az alap profil bővítményei. |
| `extensions/php.txt`, `android.txt`, `csharp.txt` | Extra profilok: `./install.sh --profiles php,android,csharp`. A beállításokat és a billentyűket az alap profillal közösen használják. Egy mappához egyszer hozzárendelve (`code --profile "C#" <mappa>`) onnantól magától abban a profilban nyílik. |
| `projects-extension/` | A saját Projects bővítmény forrása. Az installer minden futáskor újraépíti és telepíti. |
| `shell/dev.zsh` | `p`, `pc`, `c` parancsok és zoxide. Az installer a `~/.zshrc`-ből hivatkozik rá. |

### Bővítmények

| Mire | Mi |
|---|---|
| AI | Claude Code; mellette a beépített Copilot, csak kódkiegészítésre (GitHub-bejelentkezés kell hozzá) |
| Téma | Catppuccin (Mocha sötét, Latte világos, a macOS-hez igazodva vált), Catppuccin ikonok |
| TypeScript | TypeScript 7 natív language service (`js/ts.experimental.useTsgo`), kb. tízszer gyorsabb, mint a régi tsserver |
| Lint, formázás | ESLint, Prettier |
| Stack | Tailwind CSS IntelliSense (`cn()`, `cva()`, `clsx()` támogatással), Prisma, Bun, Vue (Nuxt), YAML, TOML, dotenv |
| Hibák | Error Lens (a hiba a sor végén jelenik meg), Pretty TypeScript Errors |
| Tesztek | Vitest, Playwright |
| CI, konténerek | GitHub Actions, Container Tools (Dockerfile, compose) |
| Nézegetők | PDF, SVG (előnézet és szerkesztés), Draw.io, Rainbow CSV |
| Projektek | Projects (saját, lent) |

### Projects

A Project Manager helyett. Nem a Marketplace-ről jön, hanem a `projects-extension/` mappából: két fájl, függőség nélkül.

- **Mappa ikon a felső ikonsorban:** kilistázza a `~/Developer` összes projektjét kategóriánként (Clients, Personal, School, Sandbox, Archive). A több repós ügyfelek (pl. `clients/kranem/`) külön csoportba kerülnek. Minden projekt mellett ott az aktuális git branch, a nyitott projekt zölden látszik.
- **Kattintás:** megnyitja ugyanebben az ablakban. A sor végén lévő ikonnal új ablakban nyílik. Jobb klikkre: Reveal in Finder, Copy Path.
- **Az állapotsor bal szélén** mindig ott az aktuális projekt neve. Rákattintva, vagy `Alt+Cmd+P`-vel fuzzy kereső nyílik az összes projekt között.
- **Projektnek számít** minden mappa, amiben van `.git`, `package.json`, `composer.json`, `Cargo.toml`, `pyproject.toml` vagy `go.mod`. Az új projektek maguktól megjelennek, amikor visszaváltasz az ablakra.
- **A gyökérmappa** a `devProjects.root` beállítással változtatható.

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
| `Alt+Cmd+P` | Projektváltó (az összes projekt a `~/Developer`-ben) |
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
