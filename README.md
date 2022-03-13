# React Router Gallery

## Supported
react-router-dom@^6.2.2

## Install
```bash
npm i react-router-dom react-router-gallery --save
```
```bash
yarn add react-router-dom react-router-gallery
```
## Define history
src/history.js
```js
import { createBrowserHistory } from "history";

const history = createBrowserHistory();

export default history;
```

## Usage
src/App.js
```js
import Gallery, { GalleryRouter, GalleryRoutes } from "react-router-gallery";
import { Link } from "react-router-dom";
import history from "./history";
import "react-router-gallery/lib/style/index.scss";
// or use css
// import "react-router-gallery/lib/style/index.css";

const Home = () => {
    return (
        <Gallery>
            Home
            <Link to={{ pathname: "/profile" }} state={{ gallery: true }}>
                Go to profile page
            </Link>
        </Gallery>
    );
};

const Profile = () => {
    return (
        <Gallery>
            Profile
            <Link to={{ pathname: "/" }} state={{ gallery: true }}>
                Go to home page
            </Link>
        </Gallery>
    );
};

const routes = [
    {
        name: "home",
        element: Home,
        path: "/",
    },
    {
        name: "profile",
        element: Profile,
        path: "/profile",
    },
];

const App = () => {
    return (
        <GalleryRouter history={history}>
            <GalleryRoutes routes={routes} />
        </GalleryRouter>
    );
};

export default App;
```