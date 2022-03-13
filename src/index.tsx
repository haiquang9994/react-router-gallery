import React from "react";
import { BrowserHistory } from "history";
import { Route, Routes, Router, Location, useLocation, useNavigate } from "react-router-dom";

export declare interface Element {
    ({ location }: { location: Location }): JSX.Element;
}

export declare interface GalleryRoute {
    name: string;
    path: string;
    element: Element;
}

declare interface StateWithGallery {
    gallery?: boolean;
}

const Wrap = ({ children }: { children?: React.ReactNode }) => {
    const ref = React.useRef() as React.MutableRefObject<HTMLImageElement>;
    const { location, gallery } = React.useContext(GalleryContext);

    React.useEffect(() => {
        if (!gallery) {
            return;
        }
        const timeout = setTimeout(() => {
            if (ref.current) {
                ref.current.classList.add("__active");
            }
        }, 50);
        return () => clearTimeout(timeout);
    }, []);

    if (!gallery) {
        return <div className="normal-component">{children}</div>;
    }
    return (
        <div className="gallery-component" id={`_${location.key}`} ref={ref}>
            {children}
        </div>
    );
};

const Gallery = ({
    children,
    title = undefined,
    onCancel = undefined,
    style = undefined,
}: {
    children?: React.ReactNode;
    title?: string;
    onCancel?: () => void;
    style?: React.CSSProperties;
}) => {
    const navigate = useNavigate();
    const online = React.useRef(true);
    const handleCancel = () => {
        if (online.current) {
            online.current = false;
            navigate(-1);
            typeof onCancel === "function" && onCancel();
        }
    };
    const { gallery } = React.useContext(GalleryContext);

    if (!gallery) {
        return <>{children}</>;
    }

    return (
        <>
            <div className="gallery-fog" onClick={handleCancel} />
            <div className="gallery-content" style={style}>
                {title && <div className="gallery-header">{title}</div>}
                <div className="gallery-body">{children}</div>
            </div>
        </>
    );
};

const callbacks: { [key: string]: (args: any) => any } = {};

Gallery.useCallback = (name: string, cb: (args: any) => any, deps = undefined) => {
    React.useEffect(() => {
        callbacks[name] = cb;
        return () => {
            delete callbacks[name];
        };
    }, deps);
};

Gallery.triggerCallback = (name: string, args: any = undefined) => {
    const cb = callbacks[name];
    typeof cb === "function" && cb(args);
};

const GalleryContext = React.createContext<{ location: Location; gallery: boolean }>(null!);

const RouterContext = React.createContext<{ history: BrowserHistory }>(null!);

export const GalleryRoutes = ({ routes }: { routes: GalleryRoute[] }) => {
    const [items, setItems] = React.useState<Location[]>([]);
    const current = useLocation();
    const { history } = React.useContext(RouterContext);

    const push = (item: Location) => {
        const state = item.state as StateWithGallery;
        if (!items.find((l) => l.key === item.key)) {
            state?.gallery ? setItems([...items, item]) : replaceOne(item);
        }
    };
    const pop = (item: Location) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.pop();
            setItems(newItems);
        } else {
            replaceOne(item);
        }
    };
    const replace = (item: Location) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.pop();
            setItems([...newItems, item]);
        } else {
            replaceOne(item);
        }
    };
    const replaceOne = (item: Location) => {
        const state = item.state as StateWithGallery;
        state?.gallery && delete state.gallery;
        setItems([item]);
    };

    React.useEffect(() => {
        const unlisten = history.listen(({ action, location }) => {
            if (action === "POP") {
                const state = current.state as StateWithGallery;
                if (state?.gallery) {
                    const content = document.querySelector(`#_${current.key}`);
                    content && content.classList
                        ? (content.classList.remove("__active"), setTimeout(() => pop(location), 300))
                        : pop(location);
                } else {
                    replaceOne(location);
                }
            } else if (action === "PUSH") {
                push(location);
            } else if (action === "REPLACE") {
                const locationState = location.state as StateWithGallery;
                if (locationState?.gallery) {
                    const state = current.state as StateWithGallery;
                    if (state?.gallery) {
                        const content = document.querySelector(`#_${current.key}`);
                        content && content.classList
                            ? (content.classList.remove("__active"), setTimeout(() => replace(location), 150))
                            : replace(location);
                    } else {
                        replaceOne(location);
                    }
                } else {
                    replaceOne(location);
                }
            }
        });

        return unlisten;
    }, [items]);

    React.useEffect(() => {
        items.length === 0 && replaceOne(current);
    }, []);

    return (
        <div className="gallery-list">
            {items.map((location) => {
                const state = location.state as StateWithGallery;
                const gallery = !!state?.gallery;
                return (
                    <Routes key={location.key} location={location}>
                        {routes.map((route) => {
                            const Element = route.element;
                            return (
                                <Route
                                    key={route.name}
                                    path={route.path}
                                    element={
                                        <GalleryContext.Provider
                                            value={{ location, gallery }}
                                            children={
                                                <Wrap>
                                                    <Element location={location} />
                                                </Wrap>
                                            }
                                        />
                                    }
                                />
                            );
                        })}
                    </Routes>
                );
            })}
        </div>
    );
};

export const GalleryRouter = ({ history, children }: { history: BrowserHistory; children: React.ReactNode }) => {
    const [value, setValue] = React.useState({
        action: history.action,
        location: history.location,
    });

    React.useLayoutEffect(() => history.listen(setValue), [history]);

    return (
        <RouterContext.Provider value={{ history }}>
            <Router navigator={history} location={value.location} navigationType={value.action} children={children} />
        </RouterContext.Provider>
    );
};

export default Gallery;
