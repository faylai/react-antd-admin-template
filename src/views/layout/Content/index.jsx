import React from "react";
import {Redirect, withRouter, Route, Switch, useRouteMatch} from "react-router-dom";
import DocumentTitle from "react-document-title";
import {connect, useSelector} from "react-redux";
import {CSSTransition, TransitionGroup} from "react-transition-group";
import {Layout} from "antd";
import {getMenuItemInMenuListByProperty} from "@/utils";
import routeList from "@/config/routeMap";
import menuList from "@/config/menuConfig";

const {Content} = Layout;
const cacheViews = {};
const setView = (key, el) => {
    cacheViews[key] = el;
    return cacheViews[key];
}
const getView = (key) => {
    return cacheViews[key];
}

const getPageTitle = (menuList, pathname) => {
    let title = "Ant Design Pro";
    let item = getMenuItemInMenuListByProperty(menuList, "path", pathname);
    if (item) {
        title = `${item.title} - Ant Design Pro`;
    }
    return title;
};
const LayoutContent = (props) => {
    const {role, location} = props;
    const {pathname} = location;
    console.log("pathname", pathname)
    const handleFilter = (route) => {
        // 过滤没有权限的页面
        return role === "admin" || !route.roles || route.roles.includes(role);
    };
    return (
        <DocumentTitle title={getPageTitle(menuList, pathname)}>
            <Content style={{height: "calc(100% - 100px)"}}>
                <TransitionGroup>
                    <CSSTransition
                        key={location.pathname}
                        timeout={500}
                        classNames="fade"
                        exit={false}
                    >
                        <Switch location={location}>
                            <Redirect exact from="/" to="/dashboard"/>
                            {routeList.map((route) => {
                                return (
                                    handleFilter(route) && (
                                        <Route
                                            key={route.path}
                                            path={route.path}>
                                            <DisplayCacheRouteDom {...route}></DisplayCacheRouteDom>
                                        </Route>
                                    )
                                );
                            })}
                            <Redirect to="/error/404"/>
                        </Switch>
                    </CSSTransition>
                </TransitionGroup>
            </Content>
        </DocumentTitle>
    );
};

export const LayoutContentRouter = connect((state) => state.user)(withRouter(LayoutContent));

function createPromise() {
    let _resolve;
    let _reject;
    let promise = new Promise(function (resolve, reject) {
        _resolve = resolve
        _reject = reject
    })
    return {
        promise,
        resolve: _resolve,
        reject: _reject
    }
}

const CacheRouteDom = React.memo(props => {
        const ref = React.useRef(null);
        const domPromiseRef = React.useRef(null)
        if (!domPromiseRef.current) {
            domPromiseRef.current = createPromise()
            setView(props.path, domPromiseRef.current)
        }
        const isMatch = useRouteMatch(props.path) !== null
        const isMatchRef = React.useRef(false)
        if (isMatch) {
            isMatchRef.current = true
        }
        React.useEffect(function () {
            if (ref.current) {
                //console.log("trigger promise", ref.current)
                domPromiseRef.current.resolve(ref.current.firstElementChild)
            }

        }, [ref.current])
        React.useEffect(function () {
            //console.log("create", props.path, props.isMatch)
            return function () {
                console.log("destroy", props.path)
            }
        }, [])
        console.log("props.isTagViewInStore", props.path, 'isMatch', isMatchRef.current)
        return <div ref={ref}>
            <div style={{width: '100%', height: '100%'}}>
            {isMatchRef.current ? React.createElement(props.component, props) : <div>not match {props.path}</div>}
            </div>
        </div>
    }, (prevProps, nextProps) => {
        // console.log(prevProps.path, prevProps.isMatch)
        // console.log(nextProps.path, nextProps.isMatch)
        // console.log('----------->', prevProps.path == nextProps.path && prevProps.isMatch === nextProps.isMatch)
        return prevProps.path == nextProps.path
    }
)

function WithTagViewStore(props) {
    const isTagViewInStore = useSelector((state) => {
        return state.tagsView.taglist.map(tag => tag.path).includes(props.path)
    });
    const counterRef = React.useRef(1)
    const isTagViewInStoreRef = React.useRef(isTagViewInStore)
    if (isTagViewInStoreRef.current !== isTagViewInStore) {
        counterRef.current = counterRef.current + 1
        isTagViewInStoreRef.current = isTagViewInStore
    }
    const key = [props.path, counterRef.current].join('_')
    console.log("key is", key, 'isTagViewInStore:', isTagViewInStore)
    return React.createElement(CacheRouteDom, {...props, key});
}


function DisplayCacheRouteDom(props) {
    const ref = React.useRef(null);
    function insertView(counter) {
        const domPromise = getView(props.path)
        if (ref.current && domPromise !== null) {
            domPromise.promise.then((view) => {
                console.log("insert view", counter, DisplayCacheRouteDom.counter, view)
                if (ref.current && counter === DisplayCacheRouteDom.counter) {
                    ref.current.appendChild(view)
                    window.dispatchEvent(new Event('resize'));
                }
            })
        }
    }

    React.useEffect(function () {
        if (ref.current) {
            DisplayCacheRouteDom.counter++
            insertView(DisplayCacheRouteDom.counter)
        }
    }, [ref.current])
    return <div ref={ref} style={{width: '100%', height: '100%'}}></div>
}

DisplayCacheRouteDom.counter = 1

export default function DefaultContent(props) {
    return <>
        <div style={{display: 'none'}}>
            {routeList.map((route) => {
                return <WithTagViewStore {...route} key={route.path}></WithTagViewStore>
            })}
        </div>
        <LayoutContentRouter></LayoutContentRouter>
    </>
}
