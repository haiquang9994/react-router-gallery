import { BrowserHistory } from "history";
import React, {
    CSSProperties,
    MutableRefObject,
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Location, Route, Router, Routes, useLocation, useNavigate } from "react-router-dom";

const Wrap = ({ children }) => {
    const ref = useRef();
    const { location, gallery } = useContext(GalleryContext);

    useEffect(() => {
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

let Loader = ({ children, loading = false }) => {
    if (loading) {
        return <div className="gallery-loader">Loading...</div>;
    }
    return children;
};

const Gallery = ({
    children,
    title = undefined,
    onCancel = undefined,
    style = undefined,
    loading = false,
    showNormalTitle = false,
}) => {
    const navigate = useNavigate();
    const online = useRef(true);
    const handleCancel = () => {
        if (online.current) {
            online.current = false;
            if (typeof onCancel === "function") {
                onCancel();
            } else {
                navigate(-1);
            }
        }
    };
    const { gallery } = useContext(GalleryContext);

    if (!gallery) {
        return (
            <div className="gallery-content">
                {showNormalTitle && title && <div className="gallery-header">{title}</div>}
                <Loader loading={loading} children={children} />
            </div>
        );
    }

    return (
        <>
            <div className="gallery-fog" onClick={handleCancel} />
            <div className="gallery-content" style={style}>
                {title && <div className="gallery-header">{title}</div>}
                <div className="gallery-body">
                    <Loader loading={loading} children={children} />
                </div>
            </div>
        </>
    );
};

Gallery.setLoader = (loader) => {
    Loader = loader;
};

const callbacks = {};

Gallery.useCallback = (name, cb, deps = undefined) => {
    useEffect(() => {
        callbacks[name] = cb;
        return () => {
            delete callbacks[name];
        };
    }, deps);
};

Gallery.triggerCallback = (name, args = undefined) => {
    const cb = callbacks[name];
    typeof cb === "function" && cb(args);
};

const GalleryContext = createContext({ location: undefined, gallery: false });

const RouterContext = createContext({ history: undefined, items: [], setItems: undefined });

export const useGalleryItems = () => {
    const { items } = useContext(RouterContext);

    return items;
};

export const useGallerySetItems = () => {
    const { setItems } = useContext(RouterContext);

    return setItems;
};

export const GalleryRoutes = ({ routes }) => {
    const current = useLocation();
    const { history, items, setItems } = useContext(RouterContext);
    const list = useRef([]);

    const push = (item) => {
        const state = item.state;
        if (!items.find((l) => l.key === item.key)) {
            state?.gallery ? setItems([...items, item]) : replaceOne(item);
        }
    };
    const pop = (item) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.pop();
            setItems(newItems);
        } else {
            replaceOne(item);
        }
    };
    const replace = (item) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.pop();
            setItems([...newItems, item]);
        } else {
            replaceOne(item);
        }
    };
    const replaceOne = (item) => {
        const state = item.state;
        state?.gallery && delete state.gallery;
        setItems([item]);
    };

    useEffect(() => {
        if (current.state?.gallery) {
            list.current.push(current.pathname);
        }
    }, [current]);

    useEffect(() => {
        const unlisten = history.listen(({ action, location }) => {
            if (action === "POP") {
                const state = current.state;
                if (state?.gallery) {
                    const content = document.querySelector(`#_${current.key}`);
                    content && content.classList
                        ? (content.classList.remove("__active"), setTimeout(() => pop(location), 300))
                        : pop(location);
                } else {
                    if (list.current?.includes(location.pathname)) {
                        list.current = list.current.filter((p) => p != location.pathname);
                        push(location);
                    } else {
                        replaceOne(location);
                    }
                }
            } else if (action === "PUSH") {
                list.current = [];
                push(location);
            } else if (action === "REPLACE") {
                list.current = [];
                const locationState = location.state;
                if (locationState?.gallery) {
                    const state = current.state;
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

    useEffect(() => {
        items.length === 0 && replaceOne(current);
    }, []);

    return (
        <div className="gallery-list">
            {items.map((location) => {
                const state = location.state;
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

export const GalleryRouter = ({ history, children }) => {
    const [value, setValue] = useState({
        action: history.action,
        location: history.location,
    });
    const [items, ___] = useState([]);

    const setItems = (items) => ___(items);

    useLayoutEffect(() => history.listen(setValue), [history]);

    return (
        <RouterContext.Provider value={{ history, items, setItems }}>
            <Router navigator={history} location={value.location} navigationType={value.action} children={children} />
        </RouterContext.Provider>
    );
};

export default Gallery;
