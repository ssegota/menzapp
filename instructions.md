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

Naručivanje je dostupno **samo unutar radnih sati menze** koje definira
administrator. Tipično:

- **Jutarnji termin:** npr. 08:00 – 10:00
- **Popodnevni termin:** npr. 14:00 – 16:00 *(ako je uključen)*

Postupak:

1. Otvorite tab **Nova Narudžba**.
2. Ako je termin aktivan, prikazat će se popis dostupnih jela za današnji
   dan i trenutni termin (jutro ili popodne).
3. Kliknite na željeno jelo.
4. U dijalogu potvrdite narudžbu.
5. Nakon potvrde dobit ćete **šesteroznamenkasti kod** koji predstavlja
   vašu narudžbu.

> **Napomena:** Izvan radnih sati prikazuje se poruka *„Kuhinja ne prima
> narudžbe."* zajedno s rasporedom termina. Tada novu narudžbu nije
> moguće napraviti.

Možete naručiti više obroka u istom terminu (svaki dobiva svoj kod).

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

Narudžbu možete otkazati samo dok traje radno vrijeme termina u kojem
je naručena. Nakon što završi taj termin, hrana se već priprema i
otkazivanje više nije moguće.

Postupak:

1. Otvorite tab **Aktivne Narudžbe**.
2. Kliknite na narudžbu koju želite otkazati.
3. U dijalogu kliknite **„Obriši narudžbu"**.

Ako gumb za otkazivanje nije prikazan, već stoji poruka *„Otkazivanje
narudžbe više nije moguće — vrijeme za otkazivanje je prošlo."*, znači da
je termin završen. U tom slučaju, ako narudžbu ne preuzmete, na kraju
dana će biti označena kao **nepreuzeta**.

### 1.6 Povijest narudžbi

Tab **Povijest Narudžbi** prikazuje sve vaše ranije narudžbe – one koje
ste preuzeli i one koje ste propustili preuzeti.

### 1.7 Najčešća pitanja

- **Ne vidim gumb „Sign in with Google".** Osvježite stranicu (Ctrl+F5).
  Ako se i dalje ne pojavljuje, javite administratoru.
- **Prijavio sam se, ali nema ničega za naručiti.** Vjerojatno trenutni
  termin nije aktivan ili administrator još nije unio jela za danas.
- **Pogrešno sam naručio i ne stignem otkazati.** Javite se osoblju
  menze osobno; administrator po potrebi može intervenirati.

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
| **Postavke** | Radno vrijeme termina i vremena isporuke |

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
3. Sve narudžbe na čekanju postaju nepreuzete i prelaze u sljedeći tab.

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

### 2.6 Tab „Postavke" — radno vrijeme i isporuka

Ovdje se podešava kad menza prima narudžbe i kad se one isporučuju.
Sva polja su brojevi (sati 0–23) ili vremena (HH:MM).

**Jutarnji termin:**
- *Početak* i *Kraj* – sati u kojima je jutarnja narudžba moguća
  (npr. 8 i 10 znači od 08:00 do 09:59).

**Popodnevni termin:**
- *Enable* (kvačica) – uključuje ili isključuje popodnevni termin u
  cijeloj aplikaciji. Kad je isključen, korisnici ne mogu naručivati
  popodne i tab „Popodne" se ne prikazuje.
- *Početak* i *Kraj* – analogno jutarnjima.

**Vrijeme isporuke:**
- Preporučeno vrijeme dolaska po obrok za jutarnji i popodnevni termin
  (npr. 10:30 i 16:30). Prikazuje se korisnicima.

Po promjeni vrijednosti kliknite **„Spremi Postavke"**. Promjene se
primjenjuju odmah.

> **Veza s otkazivanjem narudžbi:** Vremena ovdje izravno određuju i
> prozor unutar kojeg korisnici mogu otkazati narudžbu. Promjena radnih
> sati znači i promjenu prozora otkazivanja – planirajte u skladu s
> rasporedom kuhinje.

### 2.7 Tipični dnevni tijek (workflow)

1. **Ujutro prije termina** – u tabu *Jelovnik* unesite jela za danas
   (jutro i, ako je uključeno, popodne).
2. **Tijekom termina** – pratite tab *Narudžbe*, izdavajte obroke
   pretragom po kodu.
3. **Po završetku posljednjeg termina** – kliknite *„Prebaci u
   Nepreuzeto"* za sve neisporučene narudžbe.
4. **Na kraju dana / tjedna** – u tabu *Nepreuzeto* preuzmite CSV za
   evidenciju, zatim *„Obriši Sve"* da očistite listu.

### 2.8 Sigurnosne napomene

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
