# Upute za korištenje aplikacije MarendApp

MarendApp je web aplikacija za naručivanje obroka u menzi. Aplikacija ima
dva sučelja: jedno za **korisnike** koji naručuju obroke, i drugo za
**administratore** koji upravljaju ponudom, narudžbama i postavkama.

Aplikacija je dostupna na adresi: <https://menzapp.fly.dev>

---

## Sekcija 1 — Upute za korisnika

### 1.1 Prijava

Prijava se obavlja isključivo putem **Google računa s domenom
`@unipu.hr`**. Postupak:

1. Otvorite aplikaciju u pregledniku.
2. Kliknite gumb **„Sign in with Google"**.
3. U Google prozoru odaberite svoj `@unipu.hr` račun.
4. Po uspješnoj prijavi automatski ćete biti preusmjereni na korisničko
   sučelje.

> **Važno:** Pokušaj prijave s običnim `@gmail.com` računom ili s računom
> druge organizacije rezultira porukom:
> *„Google prijava je dozvoljena samo s unipu.hr računom – zatražite
> podatke za login od administratora."* Ako vaš `@unipu.hr` račun ne radi,
> javite se administratoru.

Prilikom prve uspješne prijave sustav automatski kreira vaš korisnički
profil koristeći ime i adresu e-pošte iz Google računa. Nije potrebna
dodatna registracija.

### 1.2 Glavno sučelje

Nakon prijave dostupna su tri taba u vrhu ekrana:

| Tab | Što sadrži |
|---|---|
| **Nova Narudžba** | Današnji meni i naručivanje |
| **Aktivne Narudžbe** | Vaše narudžbe na čekanju s kodom za preuzimanje |
| **Povijest Narudžbi** | Preuzete i nepreuzete narudžbe iz prošlosti |

### 1.3 Naručivanje obroka

Naručivanje radi po sustavu **„narudžba dan unaprijed"**:

- Obrok naručujete za **idući radni dan**. Petkom se prikazuje meni za
  ponedjeljak (vikend se preskače).
- Postoji **jedan dnevni prozor naručivanja** — po zadanim postavkama od
  **08:00 do ponoći (00:00)**. Točan raspored može mijenjati
  administrator u postavkama.
- Unutar tog prozora možete naručivati i otkazivati za idući radni dan.
  Izvan prozora aplikacija ne prima nove narudžbe niti otkazivanja.
- Termin (jutro / popodne) sami birate pri narudžbi; nije vezan uz
  trenutno vrijeme. Popodnevni termin je vidljiv samo ako ga
  administrator nije isključio u postavkama.

Postupak:

1. Otvorite tab **Nova Narudžba**.
2. Pri vrhu se prikazuje datum za koji se naručuje i rok do kojeg se
   smije naručivati/otkazivati.
3. Odaberite termin: **Jutro** ili **Popodne** (popodne je vidljivo
   samo ako ga administrator nije isključio u postavkama).
4. Kliknite na željeno jelo. Otvara se prozor s potvrdom narudžbe.
5. Klikom **„Potvrdi"** otvara se **pravna obavijest** s detaljnim
   uvjetima narudžbe — pažljivo je pročitajte.
6. Klikom **„Potvrđujem narudžbu"** narudžba se konačno bilježi i
   dobivate **šesteroznamenkasti kod** za preuzimanje.

> **Važno:** Klikom „Potvrđujem narudžbu" preuzimate obvezujuću narudžbu
> koja podrazumijeva obvezu plaćanja punog iznosa cijene obroka prema
> važećem cjeniku menze, neovisno o tome jeste li obrok preuzeli ili ne.
> Detalji su navedeni u samoj pravnoj obavijesti unutar aplikacije.

Možete naručiti više obroka za isti dan/termin (svaki dobiva svoj kod).

### 1.4 Pregled aktivnih narudžbi i preuzimanje

Tab **Aktivne Narudžbe** prikazuje sve vaše narudžbe na čekanju. Svaka
narudžba ima:

- naziv jela,
- šesteroznamenkasti kod (npr. `482917`),
- status *„Na čekanju"*.

Pri preuzimanju u menzi pokažite osoblju **kod narudžbe**. Osoblje će
narudžbu označiti kao preuzetu i ona više neće biti vidljiva u aktivnim
narudžbama – preselit će se u **Povijest**.

### 1.5 Otkazivanje narudžbe

Narudžbu je moguće otkazati **tijekom dnevnog prozora naručivanja**
(npr. 08:00 – 00:00 po zadanim postavkama), i samo dok je datum
narudžbe još uvijek u budućnosti. Kad prozor zatvori ili kad postaje
dan narudžbe, hrana je uračunata u plan kuhinje i otkazivanje više nije
moguće.

Postupak:

1. Otvorite tab **Aktivne Narudžbe**.
2. Kliknite na narudžbu koju želite otkazati.
3. U dijalogu kliknite **„Obriši narudžbu"**.

Ako gumb za otkazivanje nije prikazan, već stoji poruka *„Otkazivanje
narudžbe više nije moguće — vrijeme za otkazivanje je prošlo."*, znači da
je rok prošao. U tom slučaju, ako narudžbu ne preuzmete, na kraju dana
će biti označena kao **nepreuzeta** i naplaćuje se sukladno uvjetima
prihvaćenima pri narudžbi.

### 1.6 Povijest narudžbi

Tab **Povijest Narudžbi** prikazuje sve vaše ranije narudžbe – one koje
ste preuzeli i one koje ste propustili preuzeti.

### 1.7 Blokada zbog nepreuzetih narudžbi

Sustav automatski prati broj **nepreuzetih** narudžbi po korisniku
(narudžbe koje ste naručili, ali niste preuzeli u danom terminu).

- Svaka nepreuzeta narudžba povećava brojač.
- Kad brojač dosegne **3 nepreuzete narudžbe**, naručivanje se za vas
  **automatski blokira**. Na stranici naručivanja vidite crvenu poruku
  „Naručivanje je blokirano" zajedno s trenutnim brojem nepreuzetih.
- Otkazivanje narudžbe na vrijeme **ne broji** kao nepreuzeta — samo
  zaista propušteno preuzimanje.

**Skidanje blokade:** obratite se administratoru menze. Administrator
u svom sučelju može pregledati Vaš status, vidjeti broj nepreuzetih i
**otpustiti** Vas — time se postojeće nepreuzete arhiviraju, brojač se
resetira na 0, a Vi ponovno možete naručivati.

### 1.8 Najčešća pitanja

- **Ne vidim gumb „Sign in with Google".** Osvježite stranicu (Ctrl+F5).
  Ako se i dalje ne pojavljuje, javite administratoru.
- **Prijavio sam se, ali nema ničega za naručiti.** Administrator još
  nije unio jela za idući radni dan, ili je odabrani termin
  (jutro/popodne) prazan — probajte i drugi termin.
- **Pogrešno sam naručio i prošla je ponoć.** Otkazivanje više nije
  moguće. Javite se osoblju menze osobno; administrator po potrebi može
  intervenirati.

---

## Sekcija 2 — Upute za administratora

### 2.1 Prijava administratora

Administrator se prijavljuje korisničkim imenom i lozinkom (ne Google
računom):

1. Otvorite aplikaciju.
2. Ispod gumba „Sign in with Google" kliknite poveznicu
   **„Prijava administratora"** – pojavit će se polja za korisničko ime
   i lozinku.
3. Unesite:
   - **Korisničko ime:** `admin`
   - **Lozinku:** *(dobivena od osobe koja je postavila aplikaciju)*
4. Kliknite **Prijava**.

> **Sigurnost:** Lozinka se na poslužitelju ne čuva u čistom obliku, već
> kao kriptografski hash (scrypt) sa slučajnom soli po korisniku. Lozinku
> nemojte dijeliti niti unositi izvan ove aplikacije.

### 2.2 Pregled sučelja

Administratorsko sučelje ima četiri taba:

| Tab | Namjena |
|---|---|
| **Jelovnik** *(Menu)* | Unos jela za pojedini dan i termin |
| **Narudžbe** | Pregled pristiglih narudžbi i izdavanje obroka |
| **Nepreuzeto** | Izvoz u CSV i čišćenje nepreuzetih narudžbi |
| **Korisnici** | Pregled, pretraga i otpuštanje blokiranih korisnika |
| **Postavke** | Prozor naručivanja i vremena isporuke |

### 2.3 Tab „Jelovnik" — upravljanje jelima

Lijevo se nalazi kalendar i odabir termina, desno popis već unesenih
jela za odabrani dan/termin.

**Unos novog jela:**

1. U kalendaru odaberite datum.
2. Odaberite termin: **Jutro** ili **Popodne**. (Popodne se prikazuje
   samo ako je u postavkama uključeno.)
3. U tekstualno polje upišite jelo. **Podržan je Markdown**, što znači
   da možete koristiti:
   - `**boldano**` za istaknuti tekst,
   - liste s `-` ili `*`,
   - više linija (npr. juha + glavno + prilog).
4. Kliknite **„Dodaj Jelo"**.

> **Ograničenje:** Po jednom terminu može se unijeti najviše **5 jela**.
> Kad se popuni, gumb za dodavanje postaje neaktivan.

**Uređivanje ili brisanje postojećeg jela:**

1. Kliknite na jelo u desnoj listi.
2. U dijalogu izmijenite tekst i spremite, ili kliknite brisanje.

Vikendi su u kalendaru onemogućeni za odabir (subota i nedjelja).

### 2.4 Tab „Narudžbe" — izdavanje obroka

Ovaj tab prikazuje sve **narudžbe na čekanju** (pending). Svaka kartica
prikazuje:

- **ime korisnika** i **e-mail** (iz Google profila),
- naziv jela,
- datum i termin,
- šesteroznamenkasti kod.

**Filtriranje:**

- Padajući izbornik filtrira po terminu (Svi termini / Jutro / Popodne).
- Polje **„Traži kod…"** omogućuje brzo pronalaženje narudžbe po kodu –
  korisno kad osoba dolazi po obrok.

**Izdavanje obroka:**

1. Korisnik vam pokaže svoj kod (ili ga sami pretražite).
2. Kliknite na karticu narudžbe.
3. U dijalogu provjerite jelo i kliknite **„Potvrdi"**.
4. Narudžba se označava kao preuzeta i nestaje iz liste pending.

**Zatvaranje termina (gumb „Prebaci u Nepreuzeto"):**

Na kraju radnog dana, sve narudžbe koje nitko nije došao preuzeti
možete jednim klikom prebaciti u status **nepreuzeto**. To se preporuča
napraviti nakon završetka popodnevnog termina:

1. Kliknite **„Prebaci u Nepreuzeto"**.
2. Potvrdite dijalog.
3. Narudžbe za današnji datum koje su još uvijek na čekanju postaju
   nepreuzete i prelaze u sljedeći tab.

> **Sigurnosno ograničenje:** Akcija djeluje **isključivo na narudžbe
> čiji je datum današnji ili stariji**. Pred-narudžbe za iduće radne
> dane su zaštićene i ostaju netaknute — možete bez brige kliknuti
> gumb na kraju dana.

### 2.5 Tab „Nepreuzeto" — izvještaji i čišćenje

Ovdje su narudžbe koje su prebačene s gumba „Prebaci u Nepreuzeto", ili
narudžbe čiji je termin istekao bez preuzimanja. Tablica prikazuje:

| Stupac | Opis |
|---|---|
| **Ime** | Ime korisnika iz Google profila |
| **Email** | Adresa e-pošte korisnika |
| **Jelo** | Što je bilo naručeno |
| **Datum** | Datum i termin narudžbe |
| **Kod** | Kod narudžbe |

**Izvoz CSV-a:**

Klikom na **„Export CSV"** preuzima se datoteka `nepreuzeto.csv` s
istim podacima (uključujući ID narudžbe). Datoteka koristi:

- separator točka-zarez (`;`) – Excel s hrvatskom regionalnom postavkom
  je otvara izravno u stupcima,
- UTF-8 kodiranje s BOM oznakom – hrvatska slova (č, š, ž) ispravno se
  prikazuju i u Excelu na Windowsu.

Datoteka služi za naplatu, analitiku ili obavještavanje korisnika koji
nisu preuzeli obrok.

**Brisanje svih nepreuzetih:**

Gumb **„Obriši Sve"** arhivira sve nepreuzete narudžbe i čisti listu.
Korisno za održavanje preglednosti – preporuča se napraviti tek nakon
što ste izvezli CSV.

### 2.6 Tab „Korisnici" — pregled i otpuštanje

Sustav prati broj nepreuzetih narudžbi po korisniku. **Korisnik s 3 ili
više nepreuzetih je automatski blokiran** — ne može naručivati dok ga
administrator ne otpusti.

**Pretraga i pregled:**

- Polje **„Traži po imenu ili emailu…"** filtrira tablicu u stvarnom
  vremenu — pretražuje po imenu, korisničkom imenu i e-mailu.
- Tablica prikazuje za svakog korisnika:

| Stupac | Značenje |
|---|---|
| **Ime** | Ime iz Google profila ili korisničko ime |
| **Email** | Adresa e-pošte |
| **Nepreuzete** | Broj trenutno nepreuzetih narudžbi |
| **Status** | *OK* (zeleno), *Blokiran* (crveno) ili *Admin* (sivo) |
| **Akcija** | Gumb **Otpusti** (vidljiv samo ako korisnik ima nepreuzete) |

**Otpuštanje korisnika:**

1. Pronađite korisnika u tablici.
2. Kliknite gumb **„Otpusti"** u njegovom retku.
3. Potvrdite dijalog s prikazom broja narudžbi koje će biti arhivirane.
4. Sve nepreuzete narudžbe tog korisnika prelaze u status *arhivirano*,
   brojač pada na 0 i blokada se uklanja. Korisnik može odmah naručiti
   ponovno.

> **Napomena:** Otpuštanje djeluje **samo na tog jednog korisnika**.
> Gumb *„Obriši Sve"* u tabu *Nepreuzeto* je bulk-akcija koja arhivira
> nepreuzete svih korisnika odjednom — koristi se nakon izvoza CSV-a.

### 2.7 Tab „Postavke" — prozor naručivanja i isporuka

**Vrijeme naručivanja:**
- *Početak (sat)* i *Kraj (sat)* – jedinstveni dnevni prozor unutar
  kojeg korisnici mogu naručivati i otkazivati za idući radni dan.
  Vrijednosti su sati u 24-satnom formatu; **24 znači ponoć (00:00)**.
  Zadane vrijednosti su 8 i 24 (08:00 – ponoć).

**Popodnevni termin (slot):**
- *Omogući* (kvačica) – određuje smije li korisnik birati popodnevni
  obrok pri narudžbi. Kad je isključen, korisnik vidi samo jutarnji
  termin. Sam prozor naručivanja (iznad) ostaje isti.

**Vrijeme isporuke:**
- Preporučeno vrijeme dolaska po obrok za jutarnji i popodnevni termin
  (npr. 10:30 i 16:30). Prikazuje se korisnicima nakon potvrde
  narudžbe.

Po promjeni vrijednosti kliknite **„Spremi Postavke"**. Promjene se
primjenjuju odmah.

> **Veza s otkazivanjem narudžbi:** Prozor naručivanja istovremeno
> određuje i prozor otkazivanja. Ako ga skratite (npr. na 8–22),
> korisnici od 22:00 nadalje ne mogu ni naručivati ni otkazivati.

### 2.8 Tipični dnevni tijek (workflow)

1. **Ujutro prije termina** – u tabu *Jelovnik* unesite jela za danas
   (jutro i, ako je uključeno, popodne).
2. **Tijekom termina** – pratite tab *Narudžbe*, izdavajte obroke
   pretragom po kodu.
3. **Po završetku posljednjeg termina** – kliknite *„Prebaci u
   Nepreuzeto"* za sve neisporučene narudžbe.
4. **Na kraju dana / tjedna** – u tabu *Nepreuzeto* preuzmite CSV za
   evidenciju, zatim *„Obriši Sve"* da očistite listu.

### 2.9 Sigurnosne napomene

- Korisnička prijava strogo je vezana uz `unipu.hr` Google Workspace
  domenu; ograničenje provjerava poslužitelj kroz potpisani `hd` zahtjev
  Google ID tokena, pa se ne može zaobići s klijenta.
- Lozinka administratora pohranjena je kao scrypt hash sa slučajnom
  soli; promjena lozinke zahtijeva izmjenu okolinske varijable
  `ADMIN_PASSWORD` i ponovno pokretanje servera (detalji u
  [README.md](README.md)).
- Otkazivanje narudžbe ograničeno je radnim satima termina; pravilo se
  provodi i na klijentu (gumb se skriva) i na poslužitelju (DELETE
  zahtjev se odbija s HTTP 403 izvan prozora).

---

## Tehnička podrška

Za pitanja u vezi aplikacije, problema s prijavom ili intervencija nad
narudžbama javite se administratoru sustava ili osoblju menze.
