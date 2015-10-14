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
    let receivedUser$ = responses.HTTP
        .filter(res$ => res$.request.url.indexOf(USERS_URL) === 0)
        .mergeAll()
        .map(res => res.body)
        .startWith([])
        .tap(resp => console.log("RESPONSE", JSON.stringify(resp)));

    let userModel$ = receivedUser$
        .flatMap(users => Cycle.Rx.Observable.fromArray(users))
        .map(u => function(oldList){
            return oldList.concat([u])
        })
        .startWith([])
        //.merge(??)
        .scan(function(acc, mod){
            return mod(acc);
        })
        .tap(x => console.log("userModel", JSON.stringify(x)))

    let selectedUserModel$ =
        showUser$.withLatestFrom([userModel$],
            function(selUserId, users){
                let selUsers = users.filter(u => u.username === selUserId);
                let selUser = {};
                if(selUsers.length > 0){
                    selUser = selUsers[0];
                }
                return selUser;
            }
        )
        .tap(x => console.log("selectedUserModel tap", JSON.stringify(x)));

    let state = {
        selectedUser$: selectedUserModel$,
        users$: userModel$
    }

    //state$.subscribe(x => console.log("STATE subscribe", x));

    // -- View --
    let vtree$ = Cycle.Rx.Observable.just([]).map(x =>
        h('div', [
            h('h1', 'Cycle.js app client'),
            h('p', 'Welcome to our test'),
            h('div#wrapper', [
                h('div#userInfo', [
                    h('h2', 'User Info'),
                    h('p', state.selectedUser$.map(u =>
                        h('div',[
                            h('strong', 'Name:'),
                            h('span#userInfoName', u.username),
                            h('br'),
                            h('strong', 'Age:'),
                            h('span#userInfoAge', ""+(u.age||"")),
                            h('br'),
                            h('strong', 'Gender:'),
                            h('span#userInfoGender', u.gender),
                            h('br'),
                            h('strong', 'Location:'),
                            h('span#userInfoLocation', u.location)
                        ])
                    ))
                ]), // div#userInfo
                h('div#userList', [
                    h('h2', 'User List'),
                ].concat(state.users$.map(users =>
                    h('table', [
                        h('thead',[
                            h('tr', [
                                h('th', 'Username'),
                                h('th', 'Email'),
                                h('th', 'Delete')
                            ])
                        ]),
                        h('tbody', users.map(user =>
                            h('tr', [
                                h('td', h('a.linkshowuser', {href:"#", rel:user.username}, user.username)),
                                h('td', user.email),
                                h('td', h('a.linkdeleteuser', {href:"#", rel:user._id}, 'delete'))
                            ])
                        ))
                    ]) // table
                ))) //div#userInfo
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
