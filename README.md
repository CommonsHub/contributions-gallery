# Contributions Gallery

Make contributions to the Commons Hub Brussels visible.

## How to run locally

```
mv .env.sample .env # then edit .env with your local variables
npm install
npm run dev
```

Then you can open the frontend on http://localhost:5173

## How to deploy

```
npm run build
npm start
```

or

```
docker run -p 8000:8000 --env-file .env carousel
```
