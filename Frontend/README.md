# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

Commands Used

- npm create vite@latest
- cd Aurora-frontend
- npm i
- npm i react-router-dom
- npm install -D tailwindcss postcss autoprefixer
- npx tailwindcss init -p
- npm i daisyui@latest
- npm install react-router-dom
- npm install react-router-dom lucide-react
- npm run dev

======= AWAIS =======

NOTE:: DO NOT UPGRADE TO NODE 23, it breaks tailwind for some reason

Supabase integration

- updated package.json to include supabase
- added .env file w the serv key, `get rid of this when done`
- ~~Commands run~~
  - ~~supabase init~~
- Developing Edge functions to handle backend calls, clientside will not interact with the data in any way.
