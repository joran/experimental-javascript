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
        .tap(resp => console.log("RESPONSE", JSON.stringify(resp)));

    let mod$ = user$
        .flatMap(users => Cycle.Rx.Observable.fromArray(users))
        .map(u => function(oldList){
            return oldList.concat([u])
        })

    let state$ = mod$
        .startWith([])
        //.merge(??)
        .scan(function(acc, mod){
            return mod(acc);
        })
        .tap(x => console.log("STATE", JSON.stringify(x)))

    //state$.subscribe(x => console.log("STATE subscribe", x));

    // -- View --
    function renderUser(user){
        console.log("renderUser", JSON.stringify(user));
        return h('tr', [
            h('td', h('a.linkshowuser', {href:"#", rel:user.username}, user.username)),
            h('td', user.email),
            h('td', h('a.linkdeleteuser', {href:"#", rel:user._id}, 'delete'))
        ]);
    }

    function renderUserList(users){
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

    function renderUserInfo(user){
        return h('strong', 'Name:')
    }

    let vtree$ = Cycle.Rx.Observable.just([]).map(x =>
        h('div', [
            h('h1', 'Cycle.js app client'),
            h('p', 'Welcome to our test'),
            h('div#wrapper', [
                h('div#userInfo', [
                    h('h2', 'User Info'),
                    h('p', showUser$.map(u => h('div',
                    [
                        h('strong', 'Name:'),
                        h('span#userInfoName', u),
                        h('br'),
                        h('strong', 'Age:'),
                        h('span#userInfoAge'),
                        h('br'),
                        h('strong', 'Gender:'),
                        h('span#userInfoGender'),
                        h('br'),
                        h('strong', 'Location:'),
                        h('span#userInfoLocation')
                    ]
                )))
              ]), // div#userInfo
                h('div#userList', [
                    h('h2', 'User List'),
                ].concat(state$.map(renderUserList)))
            ]) // div#wrapper
        ]) // div
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
