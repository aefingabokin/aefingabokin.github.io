# Æfingabókin – leiðbeiningar fyrir Claude Code

Íslenskt æfingaapp (PWA) fyrir Aron og konuna hans og vinahópa. Allt viðmót og allur texti er á íslensku.
Vefslóð: https://aefingabokin.github.io (GitHub Pages, stofnunin `aefingabokin`, gagnasafnið `aefingabokin.github.io`, grein `main`).

## Uppbygging
- `index.html` – allir stílar (CSS) og grunnskel. Engin byggingarskref: hreint ES-module JavaScript.
- `js/ui.js` – allt viðmót og rökfræði (stór skrá). `js/store.js` – Firebase (Auth + Firestore). `js/settings.js` – stillingar.
- `js/coach.js` – æfingaplan/einkaþjálfari (vöðvaflokkar, plön, markmið, tvöföld framvinda).
- `js/importers.js` – innlestur úr úrum (Garmin, Strava, Apple Health, GPX/TCX). `js/pools.js` – 128 sundlaugar.
- `admin/` + `js/admin.js`, `js/admin-view.js` – stjórnborð (aðeins nafnlausar samtölur í `metrics/`).
- `firestore.rules` – öryggisreglur. Í opna kóðanum stendur `NETFANG_STJORNANDA`; raunverulega netfangið er aðeins í reglunum sem eru birtar í Firebase. Aldrei setja raunverulegt netfang í gagnasafnið.
- `sw.js` – service worker. **Hækka `CACHE` (aefingabokin-vNN) í hverri útgáfu** svo símar sæki nýjar skrár, og bæta nýjum js-skrám í `SHELL`.

## Firebase
Verkefni `aefingabokin` (Spark, ókeypis). Firestore í eur3, innskráning með netfangi og Google. Engin Firebase Storage
(prófílmyndir eru base64 í Firestore). Cloud Functions/tilkynningar þyrftu Blaze.

## Sýnishorn og prófanir (`dev/`)
- `python3 dev/build_demo.py` býr til sjálfstætt sýnishorn með tilbúnum gögnum (`dev/demo_store.js` kemur í stað Firebase,
  `dev/demo_nav.js` er „Skoða skjái“-valmyndin). Úttak: `dev/out/aefingabokin-synishorn.html`.
- `node dev/test-*.js` / `.mjs` – jsdom-prófanir á sýnishorninu (þarf `npm i jsdom`). Slóðir voru færðar úr eldra umhverfi
  og gætu þurft smá lagfæringar. Prófanirnar eiga að enda á `errors []`.

## Venjur
- Íslenska alls staðar í viðmóti, gæsalappir „ “ og bandstrik – í bilum (4–6). Engin emoji í viðmóti nema í hrósum og merkjum.
- Íþróttalitir sem CSS-breytur `--c-<íþrótt>` með ljósum og dökkum útgáfum. Glerútlit, rofar í One UI-stíl.
- Útlit vikurits: `dots` (sjálfgefið), `bars`, `tiles`, `rings`. „Litir íþrótta“ er falið í stillingum í bili.
- Allt þarf að virka í síma (412 px), á opnum Galaxy Fold (≥700 px), með valmynd vinstra megin (≥840 px) og á breiðum skjá (≥1000 px).

## Staða (útgáfa 3.6.2, CACHE v62)
3.6: stórir skjáir samkvæmt Tier 2 hjá Google (Adaptive Optimized):
- Valmynd vinstra megin (navigation rail) frá 840 px í hvaða stöðu sem er (frá 3.6.2 líka 700 px á háum skjá) (áður aðeins ≥1000 px á hlið). `measureTabs` í `ui.js` notar sama mörk.
- Skráning í tveimur dálkum frá 1000 px (`.lsplit` / `.lmain` / `.lside`, `display:contents` á minni skjám svo röðin haldist).
- Mús og snertiplatti: bendill og yfirlitun (`--hov`) aðeins á tækjum með `(hover:hover) and (pointer:fine)`.
- Flýtilyklar (`?` sýnir lista): 1–5 flipar, N ný æfing, ←/→ vikur, ↑/↓ þyngd/reps, Ctrl/⌘+S vistar. Fókus fer inn í glugga og til baka.
- Ekki gert (Tier 1): hálfopinn sími / hjör. Prófað og í lagi á Galaxy Z Fold8.
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
Hóp- og vinnustaðakeppnir (í anda Lífshlaupsins), Android-app með Health Connect, tilkynningum og Now Bar á Samsung (Android 16 Live Updates: æfing í gangi, næsta sett, hvíldartími niðurtalning, „Skrá sett“ af lásskjá; krefst Android-kóða, ekki hægt í PWA), lengri
æfingaprógrömm (4–12 vikur), sex útlitstillögur að „Vöðvum vikunnar“ (A–F), val á merki appsins, sjálfvirk afritun
og prófunarumhverfi.
