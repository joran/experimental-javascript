import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(responses){
    const USERS_URL = "http://localhost:3000/users/userlist"

    // -- Intent --
    let getUser$ = Cycle.Rx.Observable.just("")
        .map(() => {
            return {
                url: USERS_URL,
                method: "GET"
            }
        });

    let showUser$ = responses.DOM.select('.linkshowuser').events('click')
        .map(ev => ev.target.rel)
        .startWith(null)

    // -- Model --
    let user$ = responses.HTTP
        .filter(res$ => res$.request.url.indexOf(USERS_URL) === 0)
        .mergeAll()
        .map(res => res.body)
        .startWith([])
        .tap(resp => console.log("RESPONSE", resp));


    // -- View --
    function renderUser(user){
        console.log("renderUser", user);
        return h('tr', [
            h('td', h('a.linkshowuser', {href:"#", rel:user.username}, user.username)),
            h('td', user.email),
            h('td', h('a.linkdeleteuser', {href:"#", rel:user._id}, 'delete'))
        ]);
    }

    function renderUserList(users){
        console.log("renderUserList", users, users.length === 0);
        return h('table', [
            h('thead',[
                h('tr', [
                    h('th', 'Username'),
                    h('th', 'Email'),
                    h('th', 'Delete')
                ])
            ]),
            h('tbody',
                users.map(renderUser)
            )
        ]);
    }

    function showUserInfo(user){
        return h('div', JSON.stringify(user));
    }
    let vtree$ = Cycle.Rx.Observable.just([]).map(x =>
        h('div', [
            h('h1', 'Cycle.js app client'),
            h('p', 'Welcome to our test'),
            h('div#wrapper', [
                h('div#userInfo', [
                    h('h2', 'User Info'),
                    h('p', showUser$.map(user =>
                        h('div', JSON.stringify(user))
                    ))
                ]),
                h('div#userList', [
                    h('h2', 'User List'),
                ].concat(user$.map(renderUserList)))
                
            ])
        ])
    );

    return{
        DOM: vtree$,
        HTTP: getUser$
    }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});
