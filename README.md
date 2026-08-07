# MiniBank

MiniBank ist eine kleine Webanwendung, die eine vereinfachte Banking-Anwendung simuliert.
Das Projekt wurde als **eigenständiges Lern- und Praxisprojekt** entwickelt, mit besonderem Fokus auf **Cybersecurity, sichere Webentwicklung und praktische Anwendung von IT-Security-Konzepten**.

Ein wichtiger Bestandteil des Projekts ist es, typische Sicherheitsprobleme einer Webanwendung nicht nur theoretisch zu verstehen, sondern sie praktisch zu untersuchen, abzusichern und anschließend durch Tests zu überprüfen.

## Ziele

Mit MiniBank verfolge ich insbesondere folgende Ziele:

* praktische Erfahrung in **Cybersecurity und Web Application Security** sammeln
* typische Schwachstellen und Angriffsmöglichkeiten in Webanwendungen verstehen
* Authentifizierung und Autorisierung sicher implementieren
* sichere Verarbeitung von Benutzereingaben umsetzen
* Backend- und Datenbanksicherheit praktisch kennenlernen
* Sicherheitsmaßnahmen durch automatisierte Tests überprüfen
* eigene Kenntnisse im Bereich **Penetration Testing** und Web Security weiterentwickeln
* selbstständig neue Sicherheitskonzepte ausprobieren und deren Auswirkungen nachvollziehen

Das Projekt dient damit nicht nur als technische Anwendung, sondern auch als persönliche Lernumgebung für die weitere Beschäftigung mit IT-Security.

---

## Security-Fokus

Der Schwerpunkt von MiniBank liegt auf der Absicherung einer Webanwendung.

Aktuell werden unter anderem folgende Bereiche behandelt:

* **Authentifizierung**

  * Login mit Benutzername und Passwort
  * JWT-basierte Authentifizierung
  * geschützte API-Endpunkte
  * Token-Prüfung über Middleware

* **Autorisierung**

  * Benutzer dürfen nur auf ihre eigenen Konten zugreifen
  * Überweisungen werden auf die Berechtigung des Absenderkontos geprüft
  * geschützte Benutzer-, Konto- und Transaktionsdaten

* **Passwortsicherheit**

  * Passwörter werden nicht im Klartext gespeichert
  * Verwendung von `bcrypt` zum Hashen und Vergleichen von Passwörtern

* **Input Validation**

  * Prüfung von Benutzernamen
  * Prüfung von Passwörtern
  * Validierung von Konto-IDs
  * Validierung von Überweisungsbeträgen
  * Prüfung auf ungültige bzw. negative Werte

* **Datenbanksicherheit**

  * PostgreSQL
  * parametrisierte SQL-Abfragen
  * Foreign-Key-Beziehungen zwischen Benutzern, Konten und Transaktionen
  * Transaktionen bei Geldüberweisungen

* **Security Testing**

  * automatisierte Tests mit Jest
  * HTTP-Tests mit Supertest
  * Tests für Authentifizierung und Autorisierung
  * Tests für fehlerhafte Eingaben
  * Tests für Kontostände und Überweisungen

---

##  Funktionen

MiniBank verfügt aktuell unter anderem über:

* Registrierung neuer Benutzer
* Login
* JWT-basierte Sitzungen
* geschützte Dashboard-Seite
* Anzeige der eigenen Kontonummer
* Anzeige des Kontostands
* Überweisungen zwischen Konten
* Anzeige des Transaktionsverlaufs
* Abmelden
* Validierung von Eingaben
* automatisierte Backend-Tests

---

## Technologien

### Backend

* **Node.js**
* **Express**
* **PostgreSQL**
* **bcrypt**
* **JSON Web Token (JWT)**

### Frontend

* HTML
* CSS
* JavaScript

### Testing

* **Jest**
* **Supertest**

### Entwicklung

* IntelliJ IDEA
* Git
* GitHub
* PostgreSQL / psql

---

## Projektstruktur

```text
MiniBank/
│
├── backend/
│   └── src/
│       └── server.js
│
├── static/
│   ├── dashboard.js
│   ├── login.js
│   ├── register.js
│   └── style.css
│
├── templates/
│   ├── dashboard.html
│   ├── login.html
│   └── register.html
│
├── tests/
│   ├── amount-validation.test.js
│   ├── authentication.test.js
│   ├── balance.test.js
│   ├── invalid-account.test.js
│   ├── login.test.js
│   ├── registration.test.js
│   ├── successful-transaction.test.js
│   └── transactions.test.js
│
├── minibank_schema.sql
├── package.json
├── package-lock.json
├── .gitignore
└── app.py
```

---

## Voraussetzungen

Für die Ausführung werden benötigt:

* Node.js
* npm
* PostgreSQL
* Git

---

## Installation

Repository klonen:

```bash
git clone https://github.com/IlaydaAkpinar/MiniBank.git
cd MiniBank
```

Abhängigkeiten installieren:

```bash
npm install
```

Anschließend muss eine PostgreSQL-Datenbank eingerichtet und das Datenbankschema aus

```text
minibank_schema.sql
```

eingespielt werden.

Die benötigten Zugangsdaten werden über Umgebungsvariablen konfiguriert.

Beispielsweise:

```text
DB_USER=...
DB_HOST=...
DB_NAME=...
DB_PASSWORD=...
DB_PORT=...
JWT_SECRET=...
```

Die Datei `.env` wird **nicht** in das Repository eingecheckt.

---

## Anwendung starten

Der Backend-Server wird aktuell über Node.js gestartet:

```bash
node backend/src/server.js
```

Anschließend ist die Anwendung unter

```text
http://localhost:3000
```

erreichbar.

---

## Tests

Die automatisierten Tests können mit folgendem Befehl ausgeführt werden:

```bash
npm test
```

Der aktuelle Teststand umfasst unter anderem:

* Authentifizierung
* Login
* Registrierung
* Autorisierung von Transaktionen
* ungültige Kontoangaben
* ungültige Überweisungsbeträge
* erfolgreiche Überweisungen
* Kontostände

Aktueller Stand:

```text
Test Suites: 8 passed, 8 total
Tests:       16 passed, 16 total
```

---

## Datenbank

MiniBank verwendet PostgreSQL zur Speicherung von Benutzern, Konten und Transaktionen.

Das grundlegende Datenmodell besteht aus:

```text
users
  │
  └── accounts
          │
          └── transactions
```

Ein Benutzer besitzt ein Konto.
Transaktionen referenzieren ein Absender- und ein Empfängerkonto.

Überweisungen werden innerhalb einer Datenbanktransaktion durchgeführt. Dadurch wird verhindert, dass beispielsweise nur die Abbuchung erfolgt, die Gutschrift aber fehlschlägt.

---

## Security Testing & Weiterentwicklung

MiniBank wird fortlaufend erweitert und dient gleichzeitig als praktische Umgebung für das Lernen von Web Application Security.

Geplante bzw. mögliche nächste Schritte umfassen beispielsweise:

* weitere Security Tests
* Untersuchung typischer Web-Schwachstellen
* Erweiterung der Autorisierungsprüfungen
* Verbesserung der Session- und Token-Sicherheit
* Rate Limiting
* Security Headers
* CSRF-Schutz
* Logging und Monitoring
* weitere automatisierte Security Tests
* praktische Tests mit Penetration-Testing-Tools

Die Sicherheitsmaßnahmen sollen dabei nicht nur implementiert, sondern nach Möglichkeit auch gezielt getestet werden.

---

## Projektdokumentation

Eine ausführlichere technische Dokumentation wird separat erstellt.

Dort werden unter anderem die Architektur, Datenbankstruktur, Sicherheitsentscheidungen, Tests, erkannte Schwachstellen und deren Absicherung detaillierter beschrieben.

---

## Hintergrund

MiniBank ist ein eigenständig entwickeltes Lernprojekt mit dem Ziel, theoretisches Wissen praktisch anzuwenden.

Der Schwerpunkt liegt dabei auf der Verbindung von **Softwareentwicklung und Cybersecurity**. Besonders interessant sind für mich die Bereiche **Web Application Security und Penetration Testing**.

Das Projekt wird daher bewusst weiterentwickelt, um neue Sicherheitskonzepte praktisch zu untersuchen und mein Wissen durch eigenes Ausprobieren und Testen kontinuierlich zu erweitern.
