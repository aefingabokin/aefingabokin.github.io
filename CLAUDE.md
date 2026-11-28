# Æfingabókin – leiðbeiningar fyrir Claude Code

Íslenskt æfingaapp (PWA) fyrir Aron og konuna hans og vinahópa. Allt viðmót og allur texti er á íslensku.
Vefslóð: https://aefingabokin.github.io (GitHub Pages, stofnunin `aefingabokin`, gagnasafnið `aefingabokin.github.io`, grein `main`).

## Uppbygging
- `index.html` – allir stílar (CSS) og grunnskel. Engin byggingarskref: hreint ES-module JavaScript.
- `js/ui.js` – allt viðmót og rökfræði (stór skrá). `js/store.js` – Firebase (Auth + Firestore). `js/settings.js` – stillingar.
- `js/coach.js` – æfingaplan/einkaþjálfari (vöðvaflokkar, plön, markmið, tvöföld framvinda).
- `js/importers.js` – innlestur úr úrum (Garmin, Strava, Apple Health, GPX/TCX). `js/pools.js` – 128 sundlaugar.
- `js/keypad.js` – talnaborð appsins (3.7) og plötureikningur. `ui.js` sér um samhengið (`kpCtx`) og aðgerðirnar (`kpAct`).
- `admin/` + `js/admin.js`, `js/admin-view.js` – stjórnborð (aðeins nafnlausar samtölur í `metrics/`).
- `firestore.rules` – öryggisreglur. Í opna kóðanum stendur `NETFANG_STJORNANDA`; raunverulega netfangið er aðeins í reglunum sem eru birtar í Firebase. Aldrei setja raunverulegt netfang í gagnasafnið.
- `sw.js` – service worker. **Hækka `CACHE` (aefingabokin-vNN) í hverri útgáfu** svo símar sæki nýjar skrár, og bæta nýjum js-skrám í `SHELL`.

## Firebase
Verkefni `aefingabokin` (Spark, ókeypis). Firestore í eur3, innskráning með netfangi og Google. Engin Firebase Storage
(prófílmyndir eru base64 í Firestore). Cloud Functions/tilkynningar þyrftu Blaze.

## Sýnishorn og prófanir (`dev/`)
- `python3 dev/build_demo.py` býr til sjálfstætt sýnishorn með tilbúnum gögnum (`dev/demo_store.js` kemur í stað Firebase,
  `dev/demo_nav.js` er „Skoða skjái“-valmyndin). Úttak: `dev/out/aefingabokin-synishorn.html`. Ný js-eining þarf líka að
  fara inn í `build_demo.py` (eins og `keypad.js`).
- `node dev/test-*.js` / `.mjs` – jsdom-prófanir á sýnishorninu (þarf `npm i jsdom`). Slóðir voru færðar úr eldra umhverfi
  og gætu þurft smá lagfæringar. Prófanirnar eiga að enda á `errors []`.

## Venjur
- Íslenska alls staðar í viðmóti, gæsalappir „ “ og bandstrik – í bilum (4–6). Engin emoji í viðmóti nema í hrósum og merkjum.
- Íþróttalitir sem CSS-breytur `--c-<íþrótt>` með ljósum og dökkum útgáfum. Glerútlit, rofar í One UI-stíl.
- Útlit vikurits: `dots` (sjálfgefið), `bars`, `tiles`, `rings`. „Litir íþrótta“ er falið í stillingum í bili.
- Allt þarf að virka í síma (412 px), á opnum Galaxy Fold (≥700 px), með valmynd vinstra megin (≥840 px) og á breiðum skjá (≥1000 px).

## Heimasíða (`heimasida/`)
Kynningarsíða á aefingabokin.github.io/heimasida/, ein sjálfstæð `index.html` í Superhuman-stíl (pappír #F2F0EB, vín #421D24, lilla #D4C7FF,
lón #0C4243, letrið Inter). Skjámyndir úr appinu og ljósmyndir (gerðar með gervigreind, Aron má nota þær) eru í `heimasida/myndir/`.
Engar fullyrðingar um „besta appið“; allt sem síðan segir þarf að standast kóðann. Nafn Arons á ekki að vera á síðunni.
Þjónustuvinnsla appsins (sw.js) nær líka yfir síðuna: net fyrst, svo hún er alltaf ný þegar net er.

## Staða (útgáfa 3.11, CACHE v69)
3.11: deilimynd vikunnar og ársins í þremur útlitum sem notandinn velur á milli (`sharePicker`, smámyndir teiknaðar með `paintSharePicks`,
valið í localStorage `aefingabokin.sharestyle`). `drawShare(S, style)` teiknar 1080 × 1920:
- `days`: dagar vikunnar (mánuðir ársins) í lit ríkjandi íþróttar, stærsta talan með samanburði (`shareHero`: steypireyðar, fílar, fólksbílar, maraþon, hringvegurinn).
- `best`: hringur (`shareRing`: vikumarkmið ef til, annars dagar af 7, vikur á árinu) og met tímabilsins (`shareHighlight`: þyngsta sett miðað við fyrri æfingar, CrossFit PB, golfmet; annars lengsta æfingin).
- `poster`: risatala á mettuðum lit ríkjandi íþróttar (`deepRgb`, virkar með öllum litaspjöldum).
Próf: dev/test-share.mjs.

3.10.1 (CACHE v68): „Byrja á upphitun á þrektæki“ efst í „Veldu æfingu“ er áberandi spjald (`.cdfirst`, litur `--c-bike`, tákn í hring, ör).

3.10 (CACHE v67): teygjur eftir æfingu.
- Í hlutanum „Eftir æfinguna“ (`spaEditor`, með gufu og pottum) er „+ Teygjur“ fremst. Vistað sem `s.stretch = { min }`
  (`min` null ef tíminn er tómur). Tillaga að tíma er síðasti teygjutími (`lastStretchMin`, annars 10). Ekki í boði eftir jóga.
- Teygjur birtast fremst í gufu/potta-merkjunum (`spaPills(totals, stretch)`), líka hjá vinum (`sharedOf` sendir `stretch`
  aðeins ef til, svo undirskrift eldri æfinga breytist ekki).
- Hlutfall (`stretchStats`, `stretchCard`): síðustu 4 vikur, breyting frá fyrri 4 vikum í prósentustigum, 8 vikna stólpar,
  allar æfingar og meðaltími. Sýnt undir Framfarir → Lyftingar og hverri íþrótt, aðeins ef teygjur hafa einhvern tíma verið
  skráðar. Telst ekki með (`stretchable`): jóga, laugarferð án sunds, æfingar úr úri nema teygjur séu skráðar á þær.
- Útflutningur æfinga: dálkarnir Teygjur og Teygjur (mín). Kynningarglugginn (`NEWS` enn '3.9') nefnir teygjurnar líka.
- Prófanir: 37 af 40 (`dev/test-stretch.mjs` nýtt). Klasinn `.strow` er frátekinn (CrossFit-styrkur); teygjulínan heitir `.stretchrow`.

3.9 (CACHE v66): tímaæfingar (planki) og eigin þyngd (upphífingar, dýfur).
- `exKind(ex)` í `ui.js`: `'time'` (`KIND_TIME`: Planki, Hliðarplanki, Dauðahang, Veggseta), `'bw'` (`KIND_BW`: Upphífingar,
  Hökulyftur, Dýfur og „með aðstoð“-útgáfurnar) eða `'reps'`. Eigin æfingar fá `kind` af heitinu (`guessKind`) og má breyta
  („Skráð sem“ á meðan engin sett eru skráð). Nýjar tímaæfingar eru ekki í `EXMETA`, svo þær fara ekki í æfingaplön.
- Tímasett: `{ sec }`. Reiturinn er m:ss (`parseSec`: „1:30“/„1.30“ = 90, „1,5“ = 1,5 mín, „45“ = 45 sek), fljótval 0:20–2:00.
  „Telja niður“: `draft.timed = { ei, at, lead: 5, dur }`, reiknað út frá `at` (heldur áfram eftir endurræsingu), píp síðustu
  3 sek (Web Audio, „Hljóð á/af“ í `aefingabokin.tmsound`), titringur, Wake Lock. Skráist sjálft við 0; „Stöðva og skrá“ skráir
  heilar sekúndur sem náðust. „Til þrots“ = skeiðklukka (`dur: null`). Reiturinn heldur áætluðum tíma fyrir næsta sett.
- Eigin þyngd: `{ kg: heildarþyngd, reps, add: +/− kg, bw: líkamsþyngd }`. `kg` er heildarþyngdin svo met, rúmmál, 1RM og línurit
  virka óbreytt. Líkamsþyngd (`draft.bwRaw`) kemur úr nýjustu mælingu eða síðasta setti (`bwGuess`). Eldri sett án `add`:
  `addOf` túlkar kg sem aukaþyngd, eða léttingu í æfingum „með aðstoð“. Samanburður og æfingaplan miða við `add`.
- `realSet` (reps eða sek, ekki upphitun) kemur í stað `num(st.reps)` í talningu, sögu og „Síðast“. Drop er ekki í boði í
  tímaæfingum og eigin þyngd. Útflutningur setta fékk dálkana Tími (sek), Auka-/létting og Líkamsþyngd aftast.
- „Nýtt í Æfingabókinni“ (`NEWS = '3.9'`) kynnir þetta. Prófanir: 36 af 39 (`dev/test-timed.mjs` nýtt, 41 atriði).
- Ekki gert: tímaæfingar í CrossFit-styrktarhluta (`strengthEditor` er enn kg/reps); talnaborð appsins í tímareit (bíður, sjá Hugmyndir).

3.8: yfirferð á fagmennsku, hreyfing og talnasnið.
- Hreyfing (kaflinn „Hreyfing (3.8)“ neðst í stílunum, breytur `--e-out`, `--e-io`, `--e-in`, `--e-spring`): gluggar renna
  upp/niður og bakgrunnur dofnar (`.sheet` er nú alltaf `display:flex`, falinn með `visibility` + `translate`); dregið niður
  í handfangi/fyrirsögn lokar glugga; nýr skjár rís inn spjald fyrir spjald og hringir/súlur fyllast; sleði í valmyndinni
  fylgir völdum flipa (`tabInd` setur `--ti-x/y/w/h/o` á `.tabs`, `.tabs.ind::before` teiknar); hnappar gefa eftir við snertingu;
  tilkynning rennur upp; hleðsluskjár með merkinu (`.gate.boot` í `index.html`, geymt í `BOOT_HTML`).
- `viewFx(key)` í `render()` ræður hreyfingu skjásins: `enter` þegar lykillinn (gátt/flipi) breytist, annars `nextFx`
  (`swap` við prófílskipti, `wkn`/`wkp` við vikuskipti). Venjuleg endurteikning í miðri hreyfingu setur `--fxd` (neikvæð töf)
  svo hreyfingin heldur áfram í stað þess að byrja aftur. Ný hreyfing á skjá: bæta klasa í `FX` og reglu undir `#view.<klasi>`.
- Umbúðir með `display:contents` (`.hmain`, `.hside`, `.lsplit`, `.lmain`, `.lside`) hreyfast ekki sjálfar; reglurnar miða á börnin.
- Allt slokknar með „minnka hreyfingu“ (`prefers-reduced-motion`, neðst í kaflanum). Nýjar hreyfingar fara líka þangað.
- Talnasnið: Chrome/Android hefur ekki `is-IS` í `Intl.NumberFormat` og féll í enskt snið („97.5 kg“, „1,000 m“).
  `numLocale` velur nú danskt snið (eins og íslenskt: „97,5“, „1.000“) þegar íslenska vantar. Allar tölur fara um `nf`.
- Þjónustuskráin (`sw.js`): eigin skrár bíða mest `NET_WAIT` (3 s) eftir netinu, annars afrit (áður hékk appið í lélegu
  sambandi). Ef síðan sjálf kom úr afriti koma skrárnar hennar líka úr afriti (`cacheModeUntil`) svo útgáfur blandist ekki.
  Aðeins heil svör fara í afrit. Firebase-kóði og letur (fest) flytjast milli útgáfa í `activate`.
- Lagfæringar úr villuleit (sjálfstæð yfirferð á öllum kóðanum):
  - Talnaborð: `touchstart` + `preventDefault` á talnaborðinu. Áður lenti smellurinn eftir „Skrá“/„Fela“ á flipanum undir.
  - Æfing í gangi: `okToDrop()` spyr áður en önnur æfing er opnuð í hennar stað (`startDraft`, `d.edit`, `openDay`, `logday`,
    `buildFromSetup`). Aðeins ný drög með gögnum; breytingar á eldri æfingu sem er lokað með ✕ tapast enn án spurningar.
  - `draft.dropOf` er hreinsað þegar skipt er um eða fjarlægð æfing (`rmex`, `addExercise`, `ssPair`); `rmex` spyr ef sett eru skráð.
  - `renderCrash`: `try/catch` utan um teikningu flipa. Skjár sem hrynur sýnir skýringu, „Reyna aftur“ og „Henda æfingunni sem
    var í vinnslu“. Villan fer áfram sem `error`-atburður á `window` (prófanir sjá hana).
  - `progOf` → `cleanProg`: framvinda markmiða annarra er hreinsuð (áður fór `streak` óvarið í HTML).
  - `saveLog` heldur reitum sem skjárinn sér ekki um (`source`, `importKey`, `avgHr` á lyftingum o.fl.) og vistar `reps`/`rest`
    í `t`. Íþróttaval í skráningu heitir nú `setsport` (tvö `case 'settype'` rákust á).
  - `flashLogged` teiknar ekki allt upp á nýtt ef verið er að skrifa í reit (tók fókusinn og lokaði talnaborðinu).
  - `snapStep`: skref á þyngd lenda á margfeldi af skrefinu. Þyngd sýnd með tveimur aukastöfum (1,25 kg plötur).
  - Hrós á ódeilda æfingu maka býr ekki lengur til yfirlit sem vinir sjá; `putShared` skrifar ekki `kudos: {}` (þurrkaði út hrós).
  - Innlestur afrits sleppir gölluðum æfingum. `confirm` er þýtt (`i18nTr`). Æfing skráð á eldri dag fær ekki klukku.
- Ekki lagað, bíður ákvörðunar: afrit (JSON) endurheimtir ekki mælingar og markmið; nöfn eigin æfinga og lauga fara í
  nafnlausu tölfræðina (`bump('custom', …)`, `t.pools`); hrós maka á ódeildar æfingar þyrfti að geymast á æfingunni sjálfri;
  óvistaðar breytingar á eldri æfingu tapast við ✕; `celebrate` vantar fókus og Escape.
- Prófanir: 35 af 38 standast (`dev/test-motion.mjs` og `dev/test-fixes.mjs` ný; sömu þrjár vantar prófunargögn).
  Hreyfingar og snertingu verður að skoða í alvöru Chrome (`playwright-core` með `hasTouch`, snerting um CDP
  `Input.dispatchTouchEvent`); innbyggði vafrinn í Claude frystir hreyfingar þegar hann er í bakgrunni.

3.7.1: eftir skráð sett byrjar næsta sett á sömu tölum og voru skráðar (`keptCur`; í æfingaplani sama þyngd og reps
samkvæmt plani). Áður var tekið sett frá síðustu æfingu eftir númeri og upphitunarsett talin með, sem gaf ranga þyngd
(t.d. 17,5 kg). `suggestion` telur nú aðeins vinnusett. Breyting á eldra setti (og hætt við) skilar tölunum sem voru í
vinnslu (`draft.editPrev`) og eyðing setts endurstillir þær ekki.

3.7: talnaborð appsins (`js/keypad.js`) í stað lyklaborðs símans í þyngd og endurtekningum lyftinga (líka styrktarhluta):
- Reitirnir eru venjulegir `<input>` með `inputmode="none"` og `data-kp="kg|reps"`, `data-kpid` (finnst aftur eftir teikningu)
  og `data-kpdock` (lyftingaspjaldið: talnaborðið helst opið á breiðum skjá). Aðeins á snertiskjám (`pointer: coarse`).
- Takkar: tölur, komma, eyða, −/+ (sama skref og stepper, `kgStep`), „Næsta“ (þyngd → reps), „Skrá“ (kallar á `doneSet`),
  „Sama“ (reps úr síðasta setti) og fela. Haldið inni á −/+/eyða endurtekur.
- Plötur á stöng (æfingar með `eq: 'bar'` í `EXMETA`, eða „stöng“ í nafni): fæstar plötur á hlið, litakóði 25/2,5 rauð,
  20/2 blá, 15/1,5 gul, 10/1 græn, 5/0,5 hvít, 1,25 stál. Ef þyngdin gengur ekki upp eru næstu þyngdir sýndar sem hnappar.
- Þrjár útgáfur: sími (spjald neðst, lokast eftir „Skrá“), breiður skjá ≥700 px (fast spjald hægra megin, `body.kp-dock`),
  Flex-hamur (`vertical-viewport-segments: 2`, Fold hálfopinn á hlið: settið efst, takkar neðst). Prófað í hermi.
- Stillingar (Skráning): `keypad` on/off, `barKg` (20/15/10), `plates` (plötur í ræktinni), `barEx` (stöng fyrir æfingu,
  valið með „Stöng 20 kg“ á talnaborðinu).
- „Nýtt í Æfingabókinni“: gluggi einu sinni eftir uppfærslu hjá þeim sem hafa skráð æfingu (`settings.news`, `NEWS` í `ui.js`).
  Hækka `NEWS` og skrifa nýjan texta í `openNews` þegar næsta kynning kemur. Einnig undir Stillingar → Hjálp.
- `APP_VERSION` er nú `'3.7'` (fer með villutilkynningum). `dev/build_demo.py` virkar aftur. Prófanir: 33 af 36 standast
  (`dev/test-keypad.mjs` nýtt); sömu þrjár vantar prófunargögn. `test-runs.mjs` og `test-friends.mjs` geta fallið á tíma
  þegar allt er keyrt samhliða en standast ein og sér.

3.6: stórir skjáir samkvæmt Tier 2 hjá Google (Adaptive Optimized):
- Valmynd vinstra megin (navigation rail) frá 840 px í hvaða stöðu sem er (frá 3.6.2 líka 700 px á háum skjá) (áður aðeins ≥1000 px á hlið). `measureTabs` í `ui.js` notar sama mörk.
- Skráning í tveimur dálkum frá 1000 px (`.lsplit` / `.lmain` / `.lside`, `display:contents` á minni skjám svo röðin haldist).
- Mús og snertiplatti: bendill og yfirlitun (`--hov`) aðeins á tækjum með `(hover:hover) and (pointer:fine)`.
- Flýtilyklar (`?` sýnir lista): 1–5 flipar, N ný æfing, ←/→ vikur, ↑/↓ þyngd/reps, Ctrl/⌘+S vistar. Fókus fer inn í glugga og til baka.
- Tier 1 (hálfopinn sími / hjör): aðeins talnaborðið í Flex-ham (3.7). Prófað og í lagi á Galaxy Z Fold8.
- Öryggisreglur (20. nóv.): `people` aðeins `get` (ekki listi); `metrics` hert (teljarar hækka aðeins, flokkar minnka ekki,
  mest 20 reitir í skrifi). Ekki bera saman alla lykla í flokkum: fer yfir 1000 aðgerða hámark reglnanna. Prófað í hermi.
- 3.6.1: nafnadálkur vikurits lagar sig að nafninu frá 700 px (68–140 px) svo nöfn styttist ekki („Hall…“).
- 3.6.2: valmynd vinstra megin líka frá 700 px ef skjárinn er ≥600 px hár (Fold8 Ultra opinn er undir 840 px, t.d. með
  skjáaðdrætti); sími á hlið heldur stikunni neðst. Sama skilyrði í `measureTabs`. Vikurit á forsíðu undir 700 px sýnir
  aðeins mynd/upphafsstaf (`.homewk`, nafnið falið fyrir augu en ekki skjálesara), ekki „Ar…“. Markmiðahringir dreifast
  yfir spjaldið frá 700 px og logarnir standa í sömu hæð.

3.5:
- Upphitun og niðurlag á þrektæki inni í lyftingaæfingu (`s.cardio = [{ when: 'pre'|'post', machine, min, dist?, kcal? }]`,
  `MACHINES` í `ui.js`). Telst ekki sem sér æfing og ekki í sett/magn/met. Næsta skref (bíður samþykkis): sér flokkur „Þrektæki“.
- Talnareitir velja töluna þegar ýtt er á þá, svo ný tala skrifast beint yfir.
- Tæki sem vantaði í æfingasafnið (Technogym o.fl.): rassspyrna og mjaðmalyfta í vél, multi hip, beltishnébeygja o.fl.
  Ný heiti fá líka `EXMETA` í `coach.js` og enskt heiti í `i18n.js`.
- Prófanir: `dev/build_demo.py` les CSS úr eldra sýnishorni sem er ekki lengur til. 32 af 35 prófunum standast;
  `test-admin.js`, seinni hluti `test-fb.js` og `test-import.mjs` vantar prófunargögn (stjórnborðssýnishorn, `samples/`).

Eldri hönnunarvinna (í claude.ai): sýnishorn appsins, merkjatillögur, vikurit-stefnur, tillögur að „Vöðvum vikunnar“,
drop sett og súpersett, og sjö síðna kynningarbæklingur.

## Hugmyndir sem bíða (ekki byrja án samþykkis Arons)
Hóp- og vinnustaðakeppnir (í anda Lífshlaupsins), Android-app með Health Connect, tilkynningum og Now Bar á Samsung
(Android 16 Live Updates: æfing í gangi, næsta sett, hvíldartími niðurtalning, „Skrá sett“ af lásskjá; krefst Android-kóða,
ekki hægt í PWA), talnaborð appsins í fleiri reiti (tími, vegalengd, kaloríur; þarf „:“), lengri
æfingaprógrömm (4–12 vikur), sex útlitstillögur að „Vöðvum vikunnar“ (A–F), val á merki appsins, sjálfvirk afritun
og prófunarumhverfi.
