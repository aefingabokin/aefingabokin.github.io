# Æfingabókin

Æfingadagbók fyrir pör og vinahópa: lyftingar (eitt sett í einu, með því sem var tekið síðast), hlaup, göngur, sund og hjól.
Gögnin samstillast milli síma í gegnum Firebase og appið virkar líka án nets í ræktinni.

- **Maki** deilir öllu með þér og getur skráð æfingar fyrir ykkur bæði (boðshlekkur, mest tveir).
- **Vinir** tengjast með netfangi, vinakóða eða vinahlekk. Vinir sjá ekkert nema notandinn leyfi það: í Stillingum er valið
  *Ekkert*, *Spyrja í hvert skipti* (sjálfgefið), *Alltaf yfirlit* eða *Alltaf allt*.
- Í **Vinir**-flipanum er vika vina, stigatafla vikunnar, hrós á æfingar og sameiginlegar áskoranir.

Uppsetningin tekur um 20 mínútur og er gerð einu sinni.

## 1. Firebase-verkefni

1. Farðu á https://console.firebase.google.com og veldu **Add project** (t.d. `aefingabokin`). Google Analytics er óþarft.
2. Á forsíðu verkefnisins: smelltu á **</>** (Web) til að bæta við vefappi. Gefðu því nafn, sleppa Hosting.
3. Afritaðu `firebaseConfig` sem birtist og settu gildin í `js/firebase-config.js` í stað `SETTU_INN…`.
   Þessi gildi eru ekki leyndarmál, aðgangi stýra reglurnar í skrefi 4.

## 2. Innskráning

Notendur geta stofnað aðgang á tvo vegu, og báðar leiðir þarf að virkja:

1. **Build → Authentication → Get started → Sign-in method → Google → Enable → Save.**
2. Á sama stað: **Add new provider → Email/Password → Enable** (ekki *Email link*) **→ Save.**

Valfrjálst: undir **Authentication → Templates** má breyta texta póstsins sem fer út þegar lykilorð gleymist,
t.d. setja inn íslenskan texta og nafn appsins.

## 3. Gagnagrunnur

**Build → Firestore Database → Create database.** Veldu staðsetningu í Evrópu (t.d. `eur3` eða `europe-west1`) og **production mode**.

## 4. Öryggisreglur

Í Firestore: flipinn **Rules**. Eyddu því sem er þar, límdu inn allt úr `firestore.rules` og ýttu á **Publish**.
Reglurnar tryggja að aðeins þú og makinn sjáið æfingarnar ykkar í heild, og að vinir sjái aðeins það yfirlit
sem hver og einn deilir. Nöfn notenda eru sýnileg öðrum innskráðum notendum, en ekkert annað.

Ef þú uppfærir úr eldri útgáfu: límdu nýju reglurnar alltaf inn aftur (útgáfa 0.8 bætti við reglu fyrir mælingar, 1.0 fyrir markmið, 1.5 fyrir leit eftir netfangi 1.8 fyrir stjórnborðið og 1.9 fyrir athugasemdir og 2.1 fyrir ábendingar). Í útgáfu 0.5 var hert á reglunni um notendaskjöl,
svo enginn geti skráð sig í heimili annarra.

## 5. GitHub Pages

1. Búðu til nýtt repo á GitHub, t.d. `aefingabokin` (Public, því Pages er ókeypis fyrir opin repo; gögnin sjálf eru ekki í repoinu).
2. **Add file → Upload files** og dragðu allar skrárnar inn, með möppunum `js` og `icons`. **Commit changes.**
3. **Settings → Pages → Build and deployment:** Source = *Deploy from a branch*, Branch = `main` / `(root)` → Save.
4. Eftir 1 til 2 mínútur er appið á `https://NOTANDI.github.io/aefingabokin/`.

## 6. Leyfa léninu að skrá inn

Í Firebase: **Authentication → Settings → Authorized domains → Add domain** og settu inn `NOTANDI.github.io`.
Án þessa kemur villa þegar reynt er að skrá inn.

## 7. Fyrsta notkun

1. Opnaðu appið í símanum. Á upphafsskjánum velur þú **Halda áfram með Google** eða **Búa til aðgang með netfangi**.
   Svo kemur nafn, val á íþróttum og (valfrjálst) upplýsingar um þig.
2. Á forsíðunni: **Senda boðshlekk** og sendu makanum. Hún opnar hlekkinn, skráir sig inn og velur **Ganga í heimilið**.
3. Settu appið á heimaskjáinn: í Chrome eða Samsung Internet → valmynd → **Bæta við heimaskjá** / **Setja upp app**.

## Vinir

1. Vinur opnar slóðina á appið, stofnar aðgang með Google eða netfangi og velur **Byrja**.
2. Í **Vinir**-flipanum: **Bæta við vini**. Þar má slá inn netfang vinar (það sem hann skráði sig með) eða vinakóða,
   eða ýta á **Bjóða vinum** til að senda vinahlekk með Messenger, SMS, WhatsApp eða tölvupósti.
3. Sá sem opnar vinahlekk sér hver bauð honum og sendir beiðni með einum smelli. Beiðnin er samþykkt í Vinir-flipanum.
4. Í **Stillingar → Vinir og maki** velur hver og einn hvað vinir sjá af æfingunum:
   *Ekkert*, *Spyrja í hvert skipti* (sjálfgefið: spurt í lok hverrar skráningar), *Alltaf yfirlit* eða *Alltaf allt*.
   Þegar skipt er yfir í að deila er spurt hvort það eigi líka við um fyrri æfingar eða bara héðan í frá.
   Í hverri æfingu (þegar henni er breytt) má líka velja sérstaklega hvort vinir sjá hana.

Hrós er gefið með einu af fjórum viðbrögðum: 🔥 Eldur, 💪 Kraftur, 🥵 Sveitt eða 👏 Vel gert. Hrós sem þú færð birtist á forsíðunni
(ýttu á það til að sjá hver hrósaði fyrir hvað) og við æfingarnar þínar í Sögu.
**Athugasemdir:** Undir hverri æfingu sem vinur eða maki deilir er hægt að skrifa athugasemd (mest 40 orð), t.d. til að hvetja,
spyrja hvernig gekk eða hvort megi koma með næst. Tilbúnir hnappar fylla inn algeng svör. Eigandinn fær tilkynningu á forsíðunni,
getur svarað, og getur eytt athugasemdum við sínar æfingar. Hver getur eytt sínum eigin athugasemdum.

Áskorun stofnar hver sem er og velur þátttakendur úr vinum sínum. Framvinda hvers og eins uppfærist þegar hann opnar appið.

## Íþróttir

Við nýskráningu velur hver notandi hvaða íþróttir hann stundar, og þeim má breyta í **Stillingum → Íþróttir**.
Valdar íþróttir birtast sem flísar við skráningu. Allar hinar eru alltaf aðgengilegar undir **Fleiri íþróttir**.
Hver íþrótt sýnir aðeins þá reiti sem eiga við hana:

| Íþrótt | Tegundir | Reitir |
|---|---|---|
| Lyftingar | | Æfingar, sett, kg og endurtekningar |
| Hlaup | | Vegalengd, tími, hraði (mín/km), meðalpúls, álag |
| Ganga | | Vegalengd, tími, hraði |
| Fjallganga | | Fjall eða leið, vegalengd, tími, hækkun, meðalpúls |
| Sund | | Metrar, tími, hraði (mín/100 m), gufa og pottar |
| Hjól | | Vegalengd, tími, km/klst, hækkun, meðalpúls |
| Skíði | Gönguskíði, svigskíði, fjallaskíði | Gönguskíði: vegalengd, tími, púls. Svig: tími, ferðir. Fjallaskíði: vegalengd, tími, hækkun |
| Hóptími | Spinning, HIIT, Body Pump, hringþjálfun, Zumba, Boxfit eða eigið heiti | Tími, álag, meðalpúls |
| Jóga og teygjur | Jóga, heitt jóga, pilates, teygjur, liðleiki | Tími |
| Boltaíþróttir | Fótbolti, körfubolti, handbolti, blak | Tími, álag, úrslit |
| Spaðaíþróttir | Padel, tennis, badminton, squash, borðtennis | Tími, álag, úrslit |
| Golf | 9 holur, 18 holur, driving range, stutta spilið | Hringir: völlur, par vallar, högg (og árangur miðað við par), punktar, tími, vegalengd. Range: fjöldi bolta, lengsti bolti, tími |
| Róður | Róðravél, kajak | Vegalengd, tími, hraði (mín/500 m á róðravél) |
| Klifur | Grjótglíma, línuklifur | Tími, erfiðasta leið |
| Bardagaíþróttir | Box, kickbox, BJJ, júdó, karate, MMA | Tími, lotur, álag |
| Dans | | Tími, álag |
| Annað | | Heiti, vegalengd, tími |

Undir **Framfarir → Íþróttir** fær hver íþrótt viðeigandi tölfræði: vegalengd og hraða fyrir þolíþróttir,
hækkun fyrir fjallgöngu og fjallaskíði, högg (besti hringur og meðaltal síðustu hringja) fyrir golf,
og mínútur á viku fyrir íþróttir sem eru mældar í tíma. Í golfi sést besti hringur miðað við par (9 og 18 holur),
meðaltal síðustu hringja, línurit miðað við par og lengsti bolti. Nýtt persónulegt met (eftir a.m.k. fjögur skipti)
fær fagnaðarskjá og merki sem vinir sjá.

## Æfingaplan (einkaþjálfari í lyftingum)

Undir **Skrá** (og í tómri lyftingaæfingu) er **Æfingaplan**. Notandinn velur:

- **Vöðvaflokk**, einn eða tvo: Brjóst, Bak, Fætur, Rass og aftanlæri, Axlir, Hendur, Kviður og miðja. Eða samsetta
  æfingu: Allur líkaminn, Efri hluti, Neðri hluti, Push eða Pull. Appið sýnir hve langt er síðan hver flokkur var tekinn
  og mælir með þeim sem hafa fengið lengsta hvíld.
- **Markmið**: Styrkur (4–6 endurtekningar, löng hvíld), Pump (8–12, 60–120 sek.) eða Þol (15–20, stutt hvíld).
- **Reynslu**: Byrjandi (mest 3 sett, ekki undir 6 endurtekningum, vélar og handlóð) eða Vanur.
- **Tíma**: 30, 45 eða 60 mínútur, sem ræður fjölda æfinga.

Uppsetningin fylgir því sem þjálfarar gera (`js/coach.js`): þyngsta fjölliðaæfingin fyrst, svo aukaæfingar og
einangrun síðast; tveir flokkar eru paraðir saman. Aðalæfingar haldast eins milli skipta, en aukaæfingum er skipt út
eftir því hvað er lengst síðan var tekið. Áður en byrjað er má **skipta út** hverri æfingu (valkostir fyrir sama
vöðvahóp), fjarlægja, bæta við eða fá nýjar aukaæfingar.

**Framvinda (tvöföld framvinda):** Appið leggur til þyngd út frá síðustu skiptum. Þegar öll sett ná efri mörkum
endurtekninga hækkar þyngdin næst (+5 kg í fótum og rassi með stöng, +2 kg handlóð, annars +2,5 kg). Annars er sama
þyngd og markmiðið ein endurtekning í viðbót. Í æfingunni sést markmið, hvíld og tillaga, hvíldarteljarinn lætur vita
(og síminn titrar) þegar hvíldin er búin, og fyrsta æfing í styrk fær upphitunarsett.

## CrossFit

CrossFit-skráningin er höfð einföld, því flest box nota sitt eigið app fyrir æfingu dagsins: box, æfing dagsins í einni línu,
tími, álag og púls. Takkinn **„Náðirðu personal best?“** opnar lista í stafrófsröð yfir 38 algengustu PB-in í CrossFit:
lyftur (kg), fimleikaæfingar (max reps), róður og hlaup (tími) og benchmark-WOD á borð við Fran, Murph og Cindy (tími eða umferðir).
Einnig má skrá eigið PB. Appið sýnir fyrra besta og varar við ef nýja talan er ekki betri. Nýtt PB fær fagnaðarskjá og merki
sem vinir sjá, og undir Framfarir → Hóptími er tafla yfir öll PB með framför frá fyrstu skráningu.

## Sundlaugar

Við sundskráningu er valin laug úr lista yfir 128 sundlaugar og baðlón landsins (`js/pools.js`). Laugarnar sem
notandinn fer oftast í eru efst, raðaðar eftir fjölda ferða, og síðan allar hinar í íslenskri stafrófsröð með landshluta.
Hægt er að leita eftir heiti eða bæ, og ef laug vantar má skrifa heitið sjálfur. Undir Framfarir → Sund sést hvaða
laugar eru mest sóttar og hve margar af laugum landsins notandinn hefur prófað. Til að bæta laug við listann fyrir
alla er nóg að bæta línu í `js/pools.js`.

## Æfingar úr úrum

Efst á skráningarskjánum er **Sækja æfingar úr úri**, og **i** við hliðina opnar leiðbeiningar fyrir hvert úr:

| Úr | Skrá | Hvaðan |
|---|---|---|
| Garmin | Activities.csv (margar æfingar) eða .tcx / .gpx (ein æfing) | connect.garmin.com → Activities → Export CSV, eða Export to TCX á æfingu |
| Apple Watch | export.xml | Heilsa (Health) → myndin þín → Flytja út öll heilsugögn → afþjappa export.zip í Skrám |
| Strava (Coros, Polar, Suunto, Wahoo, Galaxy Watch o.fl.) | activities.csv eða .gpx | strava.com → Settings → My Account → Download or Delete Your Account |
| Galaxy Watch | (í gegnum Strava í bili) | Android-útgáfa með Health Connect les beint úr úrinu |

Skráin er lesin í símanum, og aðeins æfingarnar sjálfar eru vistaðar: tegund, dagur, vegalengd, tími, meðalpúls og hækkun.
Áður en lesið er inn sést listi þar sem velja má tímabil (síðustu 7 dagar, 30 dagar eða allt) og afhaka einstakar æfingar.
Æfingar sem eru þegar skráðar (handvirkt eða í fyrri innlestri) eru merktar og ekki valdar. Því er óhætt að lesa sömu skrána
inn aftur, t.d. í lok hverrar viku. Lyftingar úr úri koma inn með tíma og sett má bæta við eftir á.

## Setja upp sem app

Þegar síðan er opnuð í síma býður hún fólki að setja Æfingabókina á heimaskjáinn: á upphafsskjánum, einu sinni á
forsíðunni eftir innskráningu (má fela með „Seinna“) og alltaf í Stillingum → App. Í Chrome, Edge og Samsung Internet á
Android kemur innbyggði uppsetningarglugginn með einum smelli. Annars (t.d. Safari og Chrome á iPhone, eða Firefox)
birtast skref fyrir skref leiðbeiningar fyrir viðkomandi vafra. Þegar appið er opnað af heimaskjánum hverfa boðin.

## Án netsambands

Appið virkar án nets eftir að það hefur einu sinni verið opnað með neti í símanum. Æfingar sem skráðar eru án nets
vistast í símanum og sendast sjálfkrafa þegar netið kemur, líka þótt appinu sé lokað á milli. Á meðan sést lítil
tilkynning efst á skjánum. Innskráning í fyrsta sinn og innlestur úr úri þurfa net.

## Gufa og pottar

Þegar sund er skráð birtist hlutinn **Gufa og pottar**: heiti potturinn, gufa, sauna, infrarauð sauna og kaldi potturinn.
Hver lota er skráð í þeirri röð sem farið var (t.d. sauna, kalt, sauna, kalt) með sínum tíma, og tími getur verið
í mínútum (12) eða mínútum og sekúndum (1:30). Appið leggur saman eftir tegund.

- Hægt er að skrá pottaferð án þess að synda; hún birtist þá sem **Pottaferð**.
- Við aðrar æfingar (t.d. lyftingar) er hnappurinn *+ Gufa, sauna eða pottur* ef farið var í sauna eftir á.
- **Framfarir → Þol → Sund** sýnir samtals tíma og fjölda skipta síðustu 4 vikur.
- Hægt er að setja vikulegt markmið fyrir kalda pottinn eða gufu og sauna, t.d. *Kaldi potturinn 3 sinnum á viku*.
- Vinir sjá samantektina (t.d. sauna 25 mín, kalt 4 mín) og hún fylgir með í útflutningi.

## Markmið

**Framfarir → Markmið** (líka spjald á forsíðunni). Hægt er að velja tilbúið markmið með einum smelli eða búa til sitt eigið:

| Tegund | Dæmi | Hvernig framvindan er reiknuð |
|---|---|---|
| Vikuleg venja | 5 æfingar á viku, sund einu sinni í viku, 20 km hlaup á viku | Staða vikunnar, síðustu 8 vikur og hve margar vikur í röð markmiði var náð |
| Styrkur | Bekkpressa 100 kg, hnébeygja 80 kg × 5 | Þyngsta sett með að minnsta kosti þeim fjölda endurtekninga |
| Hraði | 10 km undir 50:00 | Besti tími út frá hlaupum sem voru a.m.k. jafnlöng, og hraðinn sem þarf |
| Heildarmarkmið | 500 km eða 150 æfingar fyrir áramót | Samtals á tímabilinu og hvort þú ert á undan eða á eftir áætlun |

Framvindan uppfærist sjálfkrafa við hverja skráningu. Þegar markmiði er náð birtist fagnaðarskjár og markmiðið
færist undir **Náð markmið**. Markmið má geyma (fela) eða eyða.

**Áherslan þín** er stutt setning og allt að þrjú merki (t.d. Styrkur, Hlaup) sem birtast efst á prófílnum.

**Deiling:** Hvert markmið og áherslan hafa rofann *Sýna vinum og maka*. Vinir og maki sjá samnýtt markmið á prófílnum
þínum (ýtt á nafn eða mynd í Vinir-flipanum) og sjá í listanum þegar þú nærð markmiði, og geta hrósað.
Markmið sem ekki er deilt sér enginn nema þú.

## Um þig og mælingar

Við nýskráningu er boðið upp á valfrjálst skref, **Um þig**: fæðingardagur, kyn, hæð, þyngd og fituprósenta.
Þessu má breyta síðar í **Stillingum → Um þig**, og þar er líka hægt að setja markþyngd og markfituprósentu.

Undir **Framfarir → Líkaminn** skráir hver og einn mælingar og sér þróunina:

- Þyngd, fituprósenta, vöðvamassi, hvíldarpúls og ummál (mitti, mjaðmir, brjóst, upphandleggur, læri).
- Reiknað sjálfkrafa: aldur, BMI, fitumassi og fitulaus massi.
- Línurit yfir 3 mánuði, 6 mánuði, 1 ár eða allt tímabilið, með markmiðslínu ef markmið er sett.
- Breyting síðustu 30 daga á hverju spjaldi.
- Aldurinn er líka notaður til að áætla hámarkspúls (208 − 0,7 × aldur) við mat á álagi hlaupa, ef hámarkspúls er ekki stilltur.

**Persónuvernd:** Þessar upplýsingar eru geymdar undir aðgangi hvers og eins og öryggisreglurnar leyfa engum öðrum
notanda að lesa þær, hvorki maka né vinum. Athugið þó að sá sem á Firebase-verkefnið getur tæknilega séð öll gögn
í Firebase-stjórnborðinu. Það er gott að vinir sem nota appið viti af því.

## Æfingasafnið

Í appinu eru 81 lyftingaæfing í átta flokkum (brjóst, bak, fætur, rass og mjaðmir, axlir, hendur, kviður og alhliða).
Leitin finnur líka ensk heiti og virkar án íslenskra stafa, t.d. „rdl“, „lat pulldown“ eða „rettstodu“.
Það sem vantar býr hver til sjálfur með því að skrifa heitið í leitina og velja **Búa til**.

## Álag hlaupa

Hvert hlaup fær sjálfkrafa merkið **Rólegt**, **Miðlungs** eða **Hratt**, sem birtist á spjaldinu:

- Ef meðalpúls er skráður og hámarkspúls stilltur í Stillingum: undir 77% af hámarkspúlsi telst rólegt, 77–87% miðlungs, yfir það hratt.
- Annars er hraðinn borinn saman við eigin hlaup síðustu 120 daga (hraðari fjórðunginn). 10% hægara eða meira telst rólegt.
  Þetta krefst minnst fjögurra fyrri hlaupa og verður nákvæmara eftir því sem fleiri hlaup bætast við.
- Alltaf má velja álagið handvirkt þegar hlaupið er skráð eða því breytt.

## Stillingar

Tannhjólið efst í horninu opnar stillingar hvers notanda. Þær vistast á aðganginn og fylgja honum milli síma:

- **Prófílmynd:** valin úr myndasafni símans, staðsett og þysjuð í hring. Án myndar birtist upphafsstafurinn í lit.
  Myndin er smækkuð í 256×256 og geymd á prófílnum í Firestore, svo ekki þarf Firebase Storage (sem krefst Blaze-áskriftar).
- **Útlit:** ljóst, dökkt eða eins og síminn, fimm litaþemu, textastærð og hvort glerjáferðin er á.
- **Forsíðan:** hvaða spjöld birtast og í hvaða röð.
- **Flipar:** fela Vini, Sögu eða Framfarir ef þeir eru ekki notaðir.
- **Skráning:** þyngdarskref á + og − hnöppunum og hvort appið opnast á Vikunni eða Skrá.
- **Vinir og maki, Gögn og Aðgangur.**

### Bæta við nýrri stillingu

Allar stillingar eru skilgreindar í `js/settings.js`:

1. Bættu sjálfgefnu gildi við `DEFAULTS`, t.d. `units: 'kg'`.
2. Bættu línu við `SCHEMA` í réttum flokki, t.d.
   `{ key: 'units', label: 'Þyngdareining', type: 'choice', options: [['kg', 'kg'], ['lb', 'pund']] }`.
   Hún birtist þá sjálfkrafa á stillingasíðunni og vistast á aðganginn.
3. Notaðu gildið í appinu með `settings.units`.

## Flytja gögn út

**Stillingar → Gögn → Flytja út gögn.** Hægt er að velja hvort aðeins eigin æfingar fylgja eða ykkar beggja.

| Snið | Hentar til | Innihald |
|---|---|---|
| Excel (.xlsx) | Að skoða og vinna með gögnin | Ein skrá með flipunum Æfingar, Sett og Mælingar. Dagsetningar og tölur eru raunveruleg gildi svo hægt er að raða, sía og gera gröf. |
| CSV | Að flytja gögnin í önnur forrit | Ein skrá fyrir hverja töflu. *Íslenskt Excel* notar semíkommu og kommu í tölum. *Alþjóðlegt* notar kommu og punkt og ensk dálkaheiti. |
| JSON | Fullt afrit | Öll gögn notandans, líka upplýsingar um hann. Má lesa aftur inn í appið. |

Mælingar og upplýsingar um notandann fylgja aðeins hans eigin útflutningi.
Excel-hlutinn (SheetJS) er sóttur af cdnjs í fyrsta skipti sem hann er notaður og geymdur í símanum eftir það.

## Flytja gögn úr prufuútgáfunni

Í prufuútgáfunni á claude.ai: **Stillingar → Sækja afrit**. Í nýja appinu: **Stillingar → Lesa inn afrit**,
veldu skrána og hvert ykkar á hvaða æfingar.

## Stjórnborð (/admin)

Á `https://aefingabokin.github.io/admin/` er stjórnborð fyrir eiganda appsins. Þar er skráð inn með Google,
og aðeins netfangið sem er í `isAdmin` í öryggisreglunum í Firebase hefur aðgang. Netfangið er ekki í opna
kóðanum: í `firestore.rules` hér stendur NETFANG_STJORNANDA, og raunverulega netfangið er aðeins í reglunum í Firebase.

Stjórnborðið sýnir **aðeins nafnlausar samtölur**, aldrei æfingar, mælingar eða nöfn einstakra notenda:

- Notendur alls, virkir í dag og í vikunni, nýskráningar og æfingar á dag.
- Vinsælustu íþróttir, undirtegundir (t.d. spinning, padel, 18 holur) og lyftingaæfingar.
- Æfingar sem notendur bjuggu til sjálfir, þ.e. æfingar sem vantar í safnið.
- Hvenær dags og á hvaða vikudögum fólk æfir.
- Varðveisla: hve stór hluti nýrra notenda er enn virkur 1–8 vikum eftir skráningu.
- Félagslegt (pör, vinatengsl, hrós, áskoranir), markmið og hve mörg nást, deilingarstillingar,
  innlestur úr úrum, gufa og pottar, tæki og útlitsval.
- Sjálfvirkar ábendingar, t.d. hvaða æfingum mætti bæta í safnið og besti tíminn fyrir áminningar.

Efst í stjórnborðinu eru **ábendingar frá notendum** (hugmyndir, villur og annað) sem sendar eru úr **Stillingum → Hjálp og
ábendingar**. Þær eru nafnlausar nema notandinn haki við „Það má hafa samband við mig“; þá fylgir netfangið með.
Villutilkynningum fylgir útgáfa appsins, tegund tækis og skjárinn sem var opinn. Ábendingar má merkja afgreiddar.

Appið sendir samtölurnar í `metrics`-safnið í Firestore (t.d. „ein hlaupaæfing í viðbót“). Notendur geta slökkt á þessu
í **Stillingum → Persónuvernd**. Ef nota á tölfræðina til markaðssetningar til einstakra notenda þarf sérstakt samþykki
þeirra; samtölurnar sjálfar segja ekkert um hver gerði hvað.

## Uppfærslur

Þegar skrám er breytt: hlaðið þeim upp aftur í GitHub (sama nafn kemur í staðinn). Ef breyting sést ekki strax
í símanum, lokið appinu alveg og opnið aftur. Ef mikið breytist má hækka `CACHE` númerið efst í `sw.js`.

## Kostnaður

Ókeypis Spark-áskriftin hjá Firebase dugar vel fyrir vinahóp upp á nokkra tugi manna. Ekki þarf greiðslukort.
Vinayfirlitið sækir aðeins æfingar síðustu sex vikna til að halda lestrum í lágmarki.

## Skrár

| Skrá | Hlutverk |
|---|---|
| `index.html` | Útlit og stílar |
| `js/ui.js` | Allt viðmótið og útreikningar |
| `js/store.js` | Firebase: innskráning, heimili og samstilling |
| `js/pools.js` | Listi yfir sundlaugar og baðlón landsins |
| `js/importers.js` | Lestur á skrám úr Garmin, Apple Watch og Strava |
| `admin/index.html`, `js/admin.js`, `js/admin-view.js` | Stjórnborðið á /admin |
| `js/settings.js` | Stillingar notanda: sjálfgefin gildi, litaþemu og listi yfir stillingar |
| `js/firebase-config.js` | Stillingar úr ykkar Firebase-verkefni |
| `firestore.rules` | Öryggisreglur fyrir gagnagrunninn |
| `sw.js`, `manifest.webmanifest`, `icons/` | Svo appið opnist án nets og fari á heimaskjá |

## Næst á dagskrá

Android-útgáfa (Capacitor) sem sækir hlaup, göngur og sund beint úr Galaxy Watch í gegnum Samsung Health og Health Connect.
