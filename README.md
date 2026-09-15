# Shortownia - strona + własny checkout

## Co tu jest
- `index.html` - cała strona (statyczna).
- `proof/` - screeny z YouTube Studio użyte jako dowody.
- `api/create-subscription.js` - tworzy subskrypcję w Stripe i zwraca `clientSecret` do Stripe Elements.
- `api/webhook.js` - odbiera zdarzenia ze Stripe (płatność zaliczona / subskrypcja anulowana).
- `package.json` - zależność `stripe` (Node SDK).

## Jak to wdrożyć (krok po kroku)

### 1. Wklej publiczny klucz Stripe do `index.html`
W pliku `index.html` znajdź linię:
```
var STRIPE_PUBLISHABLE_KEY = "pk_live_REPLACE_ME";
```
i zamień `pk_live_REPLACE_ME` na swój **publiczny** klucz (Stripe Dashboard -> Developers -> API keys -> Publishable key, zaczyna się od `pk_live_`). Ten klucz jest bezpieczny do wklejenia w kodzie strony - nie jest tajny.

### 2. Wgraj to na GitHub (bez terminala)
1. Wejdź na github.com, zaloguj się, kliknij **New repository** (np. nazwa `shortownia`).
2. W nowym, pustym repo kliknij **Add file -> Upload files**.
3. Przeciągnij tam **całą zawartość** tego folderu (czyli `index.html`, folder `proof/`, folder `api/`, `package.json`) - nie sam folder, tylko to co jest w nim.
4. Kliknij **Commit changes**.

### 3. Połącz repo z Vercelem
1. Wejdź na vercel.com -> **Add New -> Project**.
2. Wybierz z listy repo, które właśnie stworzyłeś na GitHubie -> **Import**.
3. Framework Preset: zostaw "Other" / domyślne - nic nie trzeba zmieniać.
4. **Zanim klikniesz Deploy**, dodaj zmienne środowiskowe (Environment Variables):
   - `STRIPE_SECRET_KEY` = Twój tajny klucz Stripe (Dashboard -> Developers -> API keys -> Secret key, zaczyna się od `sk_live_`). **Nigdy nie wklejaj tego klucza w kodzie ani na czacie** - tylko tutaj, w panelu Vercela.
   - `STRIPE_WEBHOOK_SECRET` - na razie możesz wpisać cokolwiek (np. `tmp`), i tak podmienimy to w kroku 4. Bez tego deploy się nie wywali, ale webhook nie będzie działał do czasu podania właściwego sekretu.
5. Kliknij **Deploy**.

### 4. Podłącz webhook Stripe (po pierwszym deployu)
Jak już będziesz mieć swój adres (np. `shortownia.vercel.app` albo własna domena), daj mi go znać - dodam webhook endpoint w Stripe (`https://twoja-domena/api/webhook`) i dam Ci sekret webhooka (`whsec_...`), który wtedy wklejasz do zmiennej `STRIPE_WEBHOOK_SECRET` w Vercelu i robisz redeploy (Vercel -> Deployments -> "..." -> Redeploy).

### 5. Każda kolejna zmiana
Jak coś zmienimy na stronie, wgrywasz nowy `index.html` (albo cały folder) tym samym sposobem: repo na GitHubie -> **Add file -> Upload files** -> nadpisujesz istniejące pliki -> Commit. Vercel sam zrobi nowy deploy, bo repo jest już podłączone.

## Plany subskrypcji (Grupka Insiderów)
- Miesiąc: 99 zł - `price_1UFtEHCYqOnrJwGYZJoDLb5a`
- 3 miesiące: 267 zł - `price_1UFtNECYqOnrJwGYlxPIBbC9`
- Rok: 790 zł - `price_1UFtERCYqOnrJwGYa3JfeYVM`

Klucz sekretny Stripe (`sk_live_...`) zawsze tylko w Vercel Environment Variables - nigdy w kodzie, nigdy na czacie.
