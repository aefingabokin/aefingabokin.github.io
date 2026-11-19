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
- Allt þarf að virka í síma (412 px), á opnum Galaxy Fold (≥700 px) og á hlið (≥1000 px, valmynd vinstra megin).

## Staða (útgáfa 3.4, CACHE v58)
Þessi pakki er útgáfa 3.4. Á GitHub (main) er útgáfa 3.3, nema að `sw.js` er þar enn með CACHE v43.
Það sem 3.4 bætir við og á eftir að fara á GitHub:
- Enska í Stillingum → Útlit → Tungumál / Language, og hnappur á innskráningarskjám (`js/i18n.js`, ný skrá).
- Nýtt app-tákn: merkið „A+F (2)“ (vikusúlur sem rísa úr opinni bók) í `icons/` og `manifest.webmanifest`.
- `sw.js` (CACHE v58, i18n.js í SHELL), `index.html`, `js/ui.js`, `js/settings.js`, `README.md`.
Fyrsta verk: bera saman við GitHub, keyra prófanir, commit og push á `main`.

Eldri hönnunarvinna (í claude.ai): sýnishorn appsins, merkjatillögur, vikurit-stefnur, tillögur að „Vöðvum vikunnar“,
drop sett og súpersett, og sjö síðna kynningarbæklingur.

## Hugmyndir sem bíða (ekki byrja án samþykkis Arons)
Hóp- og vinnustaðakeppnir (í anda Lífshlaupsins), Android-app með Health Connect og tilkynningum, lengri
æfingaprógrömm (4–12 vikur), sex útlitstillögur að „Vöðvum vikunnar“ (A–F), val á merki appsins, sjálfvirk afritun
og prófunarumhverfi.
