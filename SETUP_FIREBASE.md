# SafeBoard — Live Sync Setup (Firebase)

The app is split into two interfaces that stay in sync live across devices:

| File            | Who uses it        | Shows                                            |
|-----------------|--------------------|-------------------------------------------------|
| `family.html`   | Families / public  | QR check-in form only                           |
| `operator.html` | Station staff      | Operator dashboard, station display, system flow |
| `index.html`    | (optional) offline | All views in one page, no sync — for demos/dev   |

`family.html` and `operator.html` share one live state through **Firebase Realtime
Database**. A check-in on a family's phone appears on the operator's screen instantly,
on any device, anywhere.

You only need to do the one-time setup below once.

---

## 1. Create a Firebase project (free)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**, give it a name (e.g. `safeboard`), accept defaults. You can
   disable Google Analytics — not needed.

## 2. Create a Realtime Database

1. In the left menu choose **Build → Realtime Database**.
2. Click **Create Database**.
3. Pick a location (e.g. Singapore for Malaysia).
4. Start in **Test mode** (allows reads/writes for 30 days — fine for a demo/project).
   You can tighten the rules later (see "Security" below).

## 3. Register a Web App and copy the config

1. Click the gear icon → **Project settings**.
2. Under **Your apps**, click the **Web** icon (`</>`).
3. Give it a nickname, click **Register app**.
4. Firebase shows a `firebaseConfig = { ... }` object. Copy those values.

## 4. Paste the values into `firebase-config.js`

Open `firebase-config.js` and replace the placeholders with your values:

```js
const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "safeboard-xxxx.firebaseapp.com",
  databaseURL: "https://safeboard-xxxx-default-rtdb.firebaseio.com",
  projectId: "safeboard-xxxx",
  storageBucket: "safeboard-xxxx.appspot.com",
  messagingSenderId: "12345678",
  appId: "1:1234:web:abcd"
};
```

> Make sure `databaseURL` is present — it's the one Firebase sometimes hides. If you
> don't see it, it's `https://<projectId>-default-rtdb.<region>.firebasedatabase.app`
> (copy it from the Realtime Database page).

That's it — the app is now connected. (If the values are left as placeholders, the app
just runs offline with no sync and logs a warning in the browser console.)

---

## 5. Run it

Firebase needs the pages served over `http(s)`, not opened as `file://`. Two easy options:

**Option A — local server (for testing on your own machine/network):**

```bash
cd safeboard_qr_system
python3 -m http.server 8000
```

Then open `http://localhost:8000/operator.html` on the operator screen and
`http://<your-computer-ip>:8000/family.html` on a phone on the same Wi-Fi.

**Option B — Firebase Hosting (real public URLs, recommended for the demo):**

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # choose your project, set public dir to this folder
firebase deploy
```

You'll get URLs like `https://safeboard-xxxx.web.app/family.html` and
`.../operator.html` that work on any device, anywhere.

---

## How it works

- All shared state lives at `stations/sentral-p4` in the database:
  `{ families, demand, mode, log[] }`.
- `family.html` writes a check-in (a Firebase **transaction**, so simultaneous
  check-ins don't clash).
- `operator.html` subscribes with a live listener and re-renders the moment anything
  changes — no refresh, no polling.
- To run more than one platform, change `STATION_ID` in `firebase-config.js` per screen.

## Security (before any real/public use)

Test mode leaves the database open to anyone. For anything beyond a class demo, lock it
down in **Realtime Database → Rules**, e.g. allow public check-in writes but restrict
the rest, or require Firebase Auth. Ask if you want help writing rules.
